import React from "react";
import "../assets/css/index.css";
import Scene from "../components/Scene";

class Index extends React.Component {
  render() {
    return (
      <div>
        <div id="container">
          <Scene />
        </div>
      </div>
    );
  }
}

export default Index;
