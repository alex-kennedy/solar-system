import { Button, Container, IconButton, Link, Typography } from "@mui/material";
import React from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import CloseIcon from "@mui/icons-material/Close";
import RouterLink from "next/link";

import "./info.css";

class Info extends React.Component {
  render() {
    return (
      <>
        <div
          style={{
            padding: "8px",
            position: "sticky",
            backdropFilter: "blur(10px)",
            top: 0,
          }}
        >
          <RouterLink href={"/"}>
            <IconButton aria-label="close">
              <CloseIcon />
            </IconButton>
          </RouterLink>
        </div>
        <Container maxWidth="md">
          <Typography variant="h1">Solar System</Typography>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            href="https://github.com/alex-kennedy/solar-system"
            target="_blank"
            style={{ textTransform: "none", margin: "32px 0 40px 0" }}
          >
            github.com/alex-kennedy/solar-system
          </Button>
          <Typography variant="h2">About This Project</Typography>
          <p>
            An approximate visualisation of the bodies in our solar system.
            Asteroid positions are computed from Minor Planet Center orbit
            determination. No perturbations are applied to the orbits -
            calculations assume asteroids are in elliptical orbits around the
            sun - so they are inaccurate when simulating far in the future or
            past.
          </p>
          <p>
            Full code for this project is available on{" "}
            <Link
              href="https://github.com/alex-kennedy/solar-system"
              target="_blank"
            >
              GitHub
            </Link>{" "}
            and is freely licensed under the{" "}
            <Link
              href="https://github.com/alex-kennedy/solar-system/blob/main/LICENSE"
              target="_blank"
            >
              MIT License
            </Link>
            .
          </p>

          <Typography variant="h2">References</Typography>
          <ul>
            <li>
              Asteroid orbits are from the{" "}
              <Link
                href="https://www.minorplanetcenter.net/data"
                target="_blank"
              >
                International Astronomical Union Minor Planet Center
              </Link>
              .
            </li>
            <li>
              Stellar positions are from the{" "}
              <Link
                href="http://tdc-www.harvard.edu/catalogs/bsc5.html"
                target="_blank"
              >
                Yale Bright Star Catalog
              </Link>
            </li>
            <li>
              Planetary (and Pluto) orbits are computed from{" "}
              <Link
                href="https://ssd.jpl.nasa.gov/?planet_phys_par"
                target="_blank"
              >
                JPL Solar System Dynamics
              </Link>
            </li>
            <li>
              <Link
                href="https://en.wikipedia.org/wiki/Orbital_mechanics"
                target="_blank"
              >
                Orbital Mechanics, Wikipedia
              </Link>
            </li>
            <li>
              Curtis, Howard D. 2019.{" "}
              <i>
                Orbital Mechanics for Engineering Students: Revised Fourth
                Edition.
              </i>{" "}
              ISBN 978-0-08-102133-0.
            </li>
          </ul>
        </Container>
      </>
    );
  }
}

export default Info;
