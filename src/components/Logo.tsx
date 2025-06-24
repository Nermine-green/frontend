import React from "react";
import "../components/Logo.css";

const Logo = () => (
  <div className="logo-bar">
    {/* IEC logo on the left */}
    <img
      src="/assets/images/logo_IEC.png"
      alt="IEC Logo"
      className="iec-logo"
    />
    {/* ACTIA logo centered */}
    <img
      src="/assets/images/logo.png"
      alt="ACTIA Logo"
      className="actia-logo"
    />
    {/* ISO logo on the right */}
    <img
      src="/assets/images/logo_ISO.png"
      alt="ISO Logo"
      className="iso-logo"
    />
  </div>
);

export default Logo;