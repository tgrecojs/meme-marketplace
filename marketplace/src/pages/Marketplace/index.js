import React, { Fragment } from "react";
import { connect } from "react-redux";
import { useHistory, Link } from "react-router-dom";
import { Row, Col } from "react-simple-flex-grid";
import "react-simple-flex-grid/lib/main.css";
import NavBar from "../../components/NavBar";
import { getMemeTokenList } from "../../redux/actions/hub";

function Marketplace(props) {
  const { bucket, totalMemes, memesTokenList, getMemeTokenList } = props;
  const history = useHistory();

  if (!memesTokenList) {
    setInterval(getMemeTokenList, 3000);
  }

  if (!bucket) {
    history.push("/login");
  }

  return (
    <Fragment>
      <NavBar />
      <h1>Meme Marketplace</h1>
      <br />
      <br />
      <h5>
        Total Registered Memes:{" "}
        {totalMemes !== null ? totalMemes : <p>Loading...</p>}
      </h5>
      <br />
      <br />
      <h4>Showcase</h4>
      {memesTokenList ? (
        memesTokenList.length > 0 ? (
          <Row gutter={40}>
            {memesTokenList.map((meme, index) => (
              <Col key={index} span={4}>
                <div className="card" style={{ width: "18rem" }}>
                  <img
                    className="card-img-top"
                    src={`https://hub.textile.io${meme.path}`}
                    alt="Card image cap"
                  />
                  <div className="card-body">
                    <h5 className="card-title">{meme.name}</h5>
                    <p className="card-text">{meme.price}</p>
                    <font size="1">{meme.owner}</font>
                    <br />
                    <br />
                    <a
                      target="_blank"
                      href={`https://hub.textile.io${meme.path}`}
                      className="btn btn-primary"
                    >
                      See Meme on Textile Hub
                    </a>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <h6>
            No Memes in the Market! Try <Link to="/create">adding a meme!</Link>
          </h6>
        )
      ) : (
        <p>Loading...</p>
      )}
      <br />
      <br />
      <br />
      <br />
    </Fragment>
  );
}

const mapStateToProps = (state) => ({
  bucket: state.app.bucket,
  totalMemes: state.app.totalMemes,
  memesTokenList: state.app.memesTokenList,
});

const mapDispatchToProps = (dispatch) => ({
  getMemeTokenList: () => dispatch(getMemeTokenList()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Marketplace);
