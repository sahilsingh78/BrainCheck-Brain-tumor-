import React from "react";

const Loader = ({ size = 20 }) => {
  return (
    <span
      className="spinner"
      style={{
        width: size,
        height: size,
        borderWidth: 2,
      }}
    />
  );
};

export default Loader;