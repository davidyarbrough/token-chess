import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Game title
    this.add.text(width / 2, height / 3, 'Token Chess', {
      fontSize: '48px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Button styles
    const buttonStyle = {
      fontSize: '32px',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      borderRadius: 5
    };

    // Human vs Human button
    const humanVsHumanButton = this.add.text(width / 2, height / 2, 'Human vs Human', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('GameScene');
      });

    // Player vs AI button
    const playerVsAIButton = this.add.text(width / 2, height / 2 + 50, 'Player vs AI', buttonStyle)
      .setOrigin(0.5)
      .setInteractive();

    // Settings button
    const settingsButton = this.add.text(width / 2, height / 2 + 100, 'Settings', buttonStyle)
      .setOrigin(0.5)
      .setInteractive();
  }
}
