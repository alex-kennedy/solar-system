import React from 'react';
// import ReactDOM from 'react-dom';
import '../assets/css/index.css';
import Scene from '../components/Scene.js'
import Interface from '../components/Interface.js'

class Index extends React.Component {
    render () {
        return(
            <div>
                <div id="container">
                    <Scene />
                </div>
                <div id="interface">
                    {/* Let's remove the interface until it's not horrible */}
                    {/* <Interface /> */}
                </div>
            </div>  
        );
    }
}

export default Index