import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import CircularProgress from "@material-ui/core/CircularProgress";

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default class LoaderSnackbar extends React.Component {
  render() {
    return (
      <div>
        <Snackbar
          open={this.props.open}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
          <Alert
            severity="info"
            icon={<CircularProgress color={"inherit"} size={20} />}
          >
            Loading Asteroids...
          </Alert>
        </Snackbar>
      </div>
    );
  }
}
