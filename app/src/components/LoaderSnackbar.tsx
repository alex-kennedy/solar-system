import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import CircularProgress from "@material-ui/core/CircularProgress";

type LoaderSnackbarProps = {
  open: boolean;
};

export default class LoaderSnackbar extends React.Component<LoaderSnackbarProps> {
  render() {
    return (
      <div>
        <Snackbar
          open={this.props.open}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity="info"
            icon={<CircularProgress color={"inherit"} size={20} />}
          >
            Loading Asteroids...
          </MuiAlert>
        </Snackbar>
      </div>
    );
  }
}
