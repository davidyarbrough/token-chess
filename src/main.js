import 'phaser';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game',
    width: '100%',
    height: '100%',
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1200,
      height: 1600
    }
  },
  backgroundColor: '#34495e',
  scene: [TitleScene, GameScene]
};

new Phaser.Game(config);
