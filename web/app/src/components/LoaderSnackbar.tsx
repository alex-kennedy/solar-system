import React from "react";
import { Snackbar } from "@mui/material";
import { Alert } from '@mui/material';
import { CircularProgress } from "@mui/material";

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
          <Alert
            elevation={6}
            variant="filled"
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
