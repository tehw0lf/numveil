import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { environment, GameMode, Player } from '@numveil/core';
import generateAvatar from 'github-like-avatar-generator';
import { WebSocket } from 'ws';
import { randomInt, randomBytes } from 'crypto';

const connectedClients = new Map<
  string,
  { sessionID: string; socket: WebSocket }
>();

const winningNumbers = new Map<
  string,
  { uuid: string; winningNumber: number }
>();

const sessionInfo = new Map<
  string,
  {
    gameMode: GameMode;
    players: Player[];
    winningNumber: number;
  }
>();

@WebSocketGateway(Number(process.env['API_PORT']) || environment.api_port, {
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  wss: any;

  private logger = new Logger('AppGateway');

  private minimumSessionID = 100000;
  private maximumSessionID = 999999;

  afterInit(): void {
    this.logger.log('WebSocketServer initialized');
  }

  handleConnection(clientSocket: WebSocket): void {
    this.logger.log('New client connected');
  }

  handleDisconnect(clientSocket: WebSocket): void {
    if (!clientSocket) return;
    let clientUuid;
    connectedClients.forEach(
      (client: { sessionID: string; socket: WebSocket }, uuid) => {
        if (client.socket === clientSocket) {
          this.leaveSession(client.sessionID, uuid);
          clientUuid = uuid;
        }
      }
    );
    connectedClients.delete(clientUuid);
    this.logger.log(`Client ${clientUuid} disconnected.`);
  }

  @SubscribeMessage('leaveSession')
  handleIncomingLeaveSessionMessage(
    clientSocket: WebSocket,
    data: {
      uuid: string;
      sessionID: string;
    }
  ): void {
    if (!data) return;
    this.logger.log(`'leaveSession': ${JSON.stringify(data)}`);
    let clientInSession = false;
    if (sessionInfo.get(data.sessionID)) {
      sessionInfo.get(data.sessionID).players.forEach((player: Player) => {
        if (player.uuid === data.uuid) {
          clientInSession = true;
        }
      });
    }

    if (clientInSession) {
      this.leaveSession(data.sessionID, data.uuid);
    }
  }

  @SubscribeMessage('newRound')
  handleIncomingNewRoundMessage(
    clientSocket: WebSocket,
    data: { uuid: string; sessionID: string }
  ): void {
    if (!data) return;
    this.logger.log(`'newRound': ${JSON.stringify(data)}`);
    let restartRequestValid = false;
    if (sessionInfo.get(data.sessionID)) {
      sessionInfo.get(data.sessionID).players.forEach((player: Player) => {
        if (player.uuid === data.uuid) {
          restartRequestValid = true;
        }
      });
    }

    if (restartRequestValid) {
      this.restartRound(data.sessionID);
    }
  }

  @SubscribeMessage('guess')
  handleIncomingGuessMessage(
    clientSocket: WebSocket,
    data: { uuid: string; sessionID: string; guess: number }
  ): void {
    if (!data) return;
    if (!winningNumbers.get(data.sessionID)) {
      winningNumbers.set(data.sessionID, {
        uuid: data.uuid,
        winningNumber: Math.abs(data.guess),
      });
      data.guess = undefined; // we dont want the other players to know how to win
    }
    const winningUuid = winningNumbers.get(data.sessionID).uuid;
    sessionInfo.get(data.sessionID).players.forEach((player: Player) => {
      if (player.uuid === data.uuid) {
        if (player.uuid === winningUuid) {
          player.guess = undefined;
        } else {
          player.guess = data.guess;
        }
      }
    });

    const numOfPlayers = sessionInfo.get(data.sessionID).players.length;
    const guesses = this.getGuesses(data.sessionID);
    if (guesses.length === numOfPlayers - 1 && guesses.length > 0) {
      this.calculateWinners(data.sessionID, guesses);
    }
    this.broadcastToClients(
      data.sessionID,
      'running',
      sessionInfo.get(data.sessionID)
    );
  }

  @SubscribeMessage('joinSession')
  handleInitializeClientMessage(
    clientSocket: WebSocket,
    data: { uuid: string; sessionID: string; name: string }
  ): void {
    if (!data) return;
    const newSessionID = data.sessionID
      ? data.sessionID
      : this.generateSessionID();
    const newClientID = data.uuid ? data.uuid : this.generateClientID();
    const pic = generateAvatar({
      blocks: 8,
      width: 64,
    }).base64;

    if (!sessionInfo.has(data.sessionID)) {
      const players = [
        {
          uuid: newClientID,
          name: data.name,
          pic,
          guess: -1,
          won: false,
        },
      ];

      sessionInfo.set(newSessionID, {
        gameMode: GameMode.exact,
        players: players,
        winningNumber: -1,
      });
    } else {
      let playerExists = false;
      sessionInfo.get(data.sessionID).players.forEach((player: Player) => {
        if (player.uuid === newClientID) {
          playerExists = true;
        }
      });
      if (!playerExists) {
        sessionInfo.get(data.sessionID).players.push({
          uuid: newClientID,
          name: data.name,
          pic,
          guess: -1,
          won: false,
        });

        if (sessionInfo.get(data.sessionID).players.length > 2) {
          sessionInfo.get(data.sessionID).gameMode = GameMode.distance;
          this.logger.log(
            `Third player has connected, switching game mode to distance for ${data.sessionID}`
          );
        }
      }
    }

    connectedClients.set(newClientID, {
      sessionID: newSessionID,
      socket: clientSocket,
    });
    clientSocket.send(
      JSON.stringify({
        eventType: 'join',
        serverState: {
          uuid: newClientID,
          name: data.name,
          pic,
          sessionID: newSessionID,
        },
      })
    );
    this.broadcastToClients(
      newSessionID,
      'running',
      sessionInfo.get(newSessionID)
    );
  }

  private generateSessionID(): string {
    const id = randomInt(this.minimumSessionID, this.maximumSessionID + 1);
    if (sessionInfo.has(id.toString())) {
      return this.generateSessionID();
    } else {
      return id.toString();
    }
  }

  private generateClientID(): string {
    return randomBytes(16).toString('hex');
  }

  private broadcastToClients(
    sessionID: string,
    eventType: string,
    serverState: any
  ): void {
    sessionInfo.get(sessionID).players.forEach((player: Player) => {
      connectedClients
        .get(player.uuid)
        .socket.send(JSON.stringify({ eventType, serverState }));
    });
  }

  private getGuesses(sessionID: string): { uuid: string; guess: number }[] {
    const guesses = [];
    sessionInfo.get(sessionID).players.forEach((player: Player) => {
      if (player.guess >= 0) {
        guesses.push({ uuid: player.uuid, guess: player.guess });
      }
    });
    return guesses;
  }

  private restartRound(sessionID: string): void {
    winningNumbers.set(sessionID, undefined);
    sessionInfo.get(sessionID).winningNumber = -1;
    sessionInfo.get(sessionID).players.forEach((player: Player) => {
      player.guess = -1;
      player.won = false;
    });
    this.broadcastToClients(sessionID, 'restart', sessionInfo.get(sessionID));
  }

  private calculateWinners(
    sessionID: string,
    guesses: { uuid: string; guess: number }[]
  ): void {
    let currentWinners: string[];
    let currentWinningDistance = Math.min(); //Infinity
    const winningNumber = winningNumbers.get(sessionID).winningNumber;
    switch (sessionInfo.get(sessionID).gameMode) {
      case GameMode.distance:
        guesses.forEach((pair) => {
          const distance = Math.abs(pair.guess - winningNumber);
          if (distance < currentWinningDistance) {
            currentWinners = [pair.uuid];
            currentWinningDistance = distance;
          } else if (distance === currentWinningDistance) {
            currentWinners.push(pair.uuid);
          }
        });
        break;
      case GameMode.exact:
        guesses.forEach((pair) => {
          if (pair.guess === winningNumber) {
            currentWinners = [pair.uuid];
          }
        });
        break;
    }

    sessionInfo.get(sessionID).players.forEach((player: Player) => {
      if (currentWinners && currentWinners.includes(player.uuid)) {
        player.won = true;
      }
    });
    sessionInfo.get(sessionID).winningNumber = winningNumber;
  }

  private leaveSession(sessionID: string, uuid: string): void {
    if (sessionInfo.get(sessionID)) {
      const players = sessionInfo
        .get(sessionID)
        .players.filter((player: Player) => player.uuid !== uuid);
      if (players.length === 0) {
        this.logger.log(`Last player left, deleting session ${sessionID}`);
        sessionInfo.delete(sessionID);
      } else {
        sessionInfo.get(sessionID).players = players;
        this.broadcastToClients(
          sessionID,
          'running',
          sessionInfo.get(sessionID)
        );
      }
    }
  }
}
