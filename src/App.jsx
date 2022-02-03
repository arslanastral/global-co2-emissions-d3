import React from "react";
import styled from "styled-components";
import ChoroplethMap from "./components/ChoroplethMap";

const AppContainer = styled.div`
  background-repeat: repeat;
  /* background-color: blue; */
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-width: 100vw;
`;

function App() {
  return (
    <AppContainer>
      <ChoroplethMap />
    </AppContainer>
  );
}

export default App;
