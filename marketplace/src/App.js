import React from "react";
import "./App.css";
import { Provider } from "react-redux";
import Store from "./redux/store";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Marketplace from "./pages/Marketplace";
import CreateMeme from "./pages/CreateMeme";
//import Footer from "./pages/Footer";

function App() {
  return (
    <center>
      <Provider store={Store}>
        <Router>
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/marketplace">
              <Marketplace />
            </Route>
            <Route path="/create">
              <CreateMeme />
            </Route>
            <Route exact path="">
              <Login />
            </Route>
          </Switch>
        </Router>
        {/*         <div style={{ position: "absolute", bottom: "30px", width: "100%" }}>
          <Footer />
        </div> */}
      </Provider>
    </center>
  );
}

export default App;
