import React, { Component } from "react";

import { loadBrightStars } from "../lib/bright_stars";
import AsteroidsWorker from "../workers/asteroids.worker";
import LoadErrorSnackbar from "./LoadErrorSnackbar";
import { Asteroids } from "../lib/asteroids";
import { Scene } from "../lib/scene";

import LoaderSnackbar from "./LoaderSnackbar";

class SceneComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { loadingAsteroids: true, loadingAsteroidsError: false };
    window.scene = this; // For debugging
  }

  mountScene = (mount) => {
    this.scene = new Scene(mount);
    this.scene.startAnimation();
    this.renderBrightStars();

    const worker = new AsteroidsWorker();
    worker.onmessage = this.handleAsteroidWorkerMessage;
    worker.postMessage({ cmd: "init" });

    window.addEventListener("resize", this.scene.updateDimensions);
  };

  handleAsteroidWorkerMessage = (message) => {
    if (message.data.cmd === "error") {
      this.handleAsteroidLoadFailure();
    } else if (message.data.cmd === "initComplete") {
      this.renderAsteroids(message.data.asteroids);
    }
  };

  handleAsteroidLoadFailure = () => {
    this.setState({ loadingAsteroids: false, loadingAsteroidsError: true });
  };

  handleAsteroidErrorClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ loadingAsteroidsError: false });
  };

  renderBrightStars = async () => {
    try {
      const brightStars = await loadBrightStars();
      this.scene.showBrightStars(brightStars);
    } catch (err) {
      console.error("Failed to load bright stars!", err);
    }
  };

  renderAsteroids = (asteroidsProto) => {
    const asteroids = Asteroids.fromAsteroidsProto(asteroidsProto);
    this.scene.showAsteroids(asteroids);

    // Use the current time for asteroid positions.
    this.scene.setTime(Date.now() / 1000);
    this.setState({ loadingAsteroids: false });
  };

  componentWillUnmount() {
    this.scene.unmount();
  }

  render() {
    return (
      <>
        <div style={{ width: "100%", height: "100%" }} ref={this.mountScene} />
        <LoaderSnackbar open={this.state.loadingAsteroids} />
        <LoadErrorSnackbar
          open={this.state.loadingAsteroidsError}
          handleClose={this.handleAsteroidErrorClose}
        />
      </>
    );
  }
}

export default SceneComponent;
