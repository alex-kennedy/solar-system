import React, { Component, SyntheticEvent } from "react";

import { loadBrightStars } from "../lib/bright_stars";
import LoadErrorSnackbar from "./LoadErrorSnackbar";
import { Asteroids } from "../lib/asteroids";
import { Asteroids as AsteroidsProto } from "../lib/proto/asteroids";
import { Scene } from "../lib/scene";

import LoaderSnackbar from "./LoaderSnackbar";
import { SnackbarCloseReason } from "@mui/material";

interface SceneState {
  loadingAsteroids: boolean;
  loadingAsteroidsError: boolean;
  timeMs: number;
}

interface AsteroidsMessage {
  cmd: string;
  asteroids: AsteroidsProto;
}

class SceneComponent extends Component<{}, SceneState> {
  scene: Scene | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      loadingAsteroids: true,
      loadingAsteroidsError: false,
      timeMs: 0,
    };
    (window as any).scene = this; // For debugging
  }

  setTimeMs = (timeMs: number) => {
    this.setState({ timeMs });
  };

  mountScene = (mount: HTMLDivElement | null) => {
    if (mount === null) {
      return;
    }
    this.scene = new Scene(mount, this.setTimeMs);
    this.scene.startAnimation();

    this.renderBrightStars();

    const worker = new Worker(
      new URL("../workers/asteroids.worker.ts", import.meta.url)
    );
    worker.onmessage = this.handleAsteroidWorkerMessage;
    worker.postMessage({ cmd: "init" });

    window.addEventListener("resize", this.scene.updateDimensions);
  };

  handleAsteroidWorkerMessage = (message: { data: AsteroidsMessage }) => {
    if (message.data.cmd === "error") {
      this.handleAsteroidLoadFailure();
    } else if (message.data.cmd === "initComplete") {
      this.renderAsteroids(message.data.asteroids);
    }
  };

  handleAsteroidLoadFailure = () => {
    this.setState({ loadingAsteroids: false, loadingAsteroidsError: true });
  };

  handleAsteroidErrorClose = (
    event: Event | SyntheticEvent,
    reason: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ loadingAsteroidsError: false });
  };

  renderBrightStars = async () => {
    try {
      const brightStars = await loadBrightStars();
      this.scene!.showBrightStars(brightStars);
    } catch (err) {
      console.error("Failed to load bright stars!", err);
    }
  };

  renderAsteroids = (asteroidsProto: AsteroidsProto) => {
    if (this.scene === null) {
      console.error("Unexpected error for render asteroids! Scene was null!");
      this.handleAsteroidLoadFailure();
      return;
    }

    const asteroids = Asteroids.fromAsteroidsProto(asteroidsProto);
    this.scene.showAsteroids(asteroids);

    this.setState({ loadingAsteroids: false });
  };

  componentWillUnmount() {
    this.scene!.unmount();
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
