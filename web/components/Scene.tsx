import React, { useEffect, useRef, useState } from "react";

import LoadErrorSnackbar from "@/components/LoadErrorSnackbar";
import LoaderSnackbar from "@/components/LoaderSnackbar";
import Controls from "@/components/Controls";
import { Scene } from "@/lib/scene";

// Singleton instance of a scene. It can be mounted and unmounted from the DOM,
// but ensures all the heavy dependencies are only loaded once.
const scene = new Scene(null);

function SceneFunction() {
  const sceneDivRef = useRef<HTMLDivElement>(null);
  const [loadingAsteroids, setLoadingAsteroids] = useState<boolean>(true);
  const [loadingAsteroidsError, setLoadingAsteroidsError] =
    useState<boolean>(false);

  useEffect(() => {
    scene.mount(sceneDivRef.current);
    scene
      .getAsteroids()
      .then(() => {
        setLoadingAsteroids(false);
        setLoadingAsteroidsError(false);
      })
      .catch(() => {
        setLoadingAsteroids(false);
        setLoadingAsteroidsError(true);
      });
    return () => {
      scene.unmount();
    };
  }, [sceneDivRef]);

  const handleAsteroidErrorClose = () => {
    setLoadingAsteroidsError(false);
  };

  const onSpeedChange = (speed: number) => {
    scene.setAnimationRate(speed);
  };

  return (
    <>
      <div style={{ width: "100%", height: "100%" }} ref={sceneDivRef} />
      <Controls onSpeedChange={onSpeedChange} />
      <LoaderSnackbar open={loadingAsteroids} />
      <LoadErrorSnackbar
        open={loadingAsteroidsError}
        handleClose={handleAsteroidErrorClose}
      />
    </>
  );
}

export default SceneFunction;
