import React, { Fragment } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import Footer from "../Footer";
import { loginAndCreateBucket } from "../../redux/actions/hub";

function Login(props) {
  const { bucket, loginAndCreateBucket } = props;
  const history = useHistory();

  if (bucket) {
    history.push("/create");
  }

  return (
    <Fragment>
      <br />
      <h1>Login</h1>
      <br />
      <br />
      <br />
      <button
        id="login"
        className="btn btn-primary mb-2"
        onClick={() => loginAndCreateBucket()}
      >
        Log in
      </button>
      <div style={{ position: "absolute", bottom: "30px", width: "100%" }}>
        <Footer />
      </div>
    </Fragment>
  );
}

const mapStateToProps = (state) => ({
  bucket: state.app.bucket,
});

const mapDispatchToProps = (dispatch) => ({
  loginAndCreateBucket: () => dispatch(loginAndCreateBucket()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
