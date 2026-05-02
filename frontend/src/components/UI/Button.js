import React from "react";
import Loader from "./Loader";

const Button = ({
  children,
  loading = false,
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader size={16} />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;