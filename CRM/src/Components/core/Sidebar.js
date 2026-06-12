import React, { useState, useEffect, memo } from "react";
import { Link, withRouter } from "react-router-dom";
import { signout, isAuthenticated } from "../../Utils/Requests/Auth";
import {
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setItemToLocalStorage,
} from "../../Utils/Requests/LocalStorage";
import { busKey, peopleKey, SERVER_ROUTE } from "../../Utils/config";
import { defaultAdminImage } from "../../Utils/helpers";
import { removeAllBuses } from "../../Utils/Requests/Bus";
import { removeAllTravels } from "../../Utils/Requests/Travel";
import { removeAllLocations } from "../../Utils/Requests/Location";
import Swal from "sweetalert2";

const SideBar = memo(({ history }) => {
  const [sidebarPeople, setSidebarPeople] = useState(
    getItemFromLocalStorage(peopleKey)
  );
  const [sidebarBuses, setSidebarBuses] = useState(
    getItemFromLocalStorage(busKey)
  );
  const [menu, setMenu] = useState({
    display: sidebarBuses ? "block" : "none",
  });
  const [people, setPeople] = useState({
    display: sidebarPeople ? "block" : "none",
  });
  const [sidebarTravels, setSidebarTravels] = useState(
    getItemFromLocalStorage("travelsKey")
  );
  const [travelsMenu, setTravelsMenu] = useState({
    display: sidebarTravels ? "block" : "none",
  });
  const [sidebarLocations, setSidebarLocations] = useState(
    getItemFromLocalStorage("locationsKey")
  );
  const [locationsMenu, setLocationsMenu] = useState({
    display: sidebarLocations ? "block" : "none",
  });

  const { user } = isAuthenticated();

  useEffect(() => {
    if (sidebarBuses) {
      setMenu({ display: "block" });
    } else {
      setMenu({ display: "none" });
    }

    if (sidebarPeople) {
      setPeople({ display: "block" });
    } else {
      setPeople({ display: "none" });
    }

    if (sidebarTravels) {
      setTravelsMenu({ display: "block" });
    } else {
      setTravelsMenu({ display: "none" });
    }

    if (sidebarLocations) {
      setLocationsMenu({ display: "block" });
    } else {
      setLocationsMenu({ display: "none" });
    }
  }, []);

  const isActive = (history, path) => {
    if (history.location.pathname === path) {
      return "active";
    } else if (history.location.pathname.includes("bus") && path === "bus") {
      return "active";
    } else if (
      history.location.pathname.includes("people") &&
      path === "people"
    ) {
      return "active";
    } else if (
      history.location.pathname.includes("travel") &&
      path === "travel"
    ) {
      return "active";
    } else if (
      history.location.pathname.includes("location") &&
      path === "location"
    ) {
      return "active";
    } else {
      return;
    }
  };

  const toggleMenu = (value) => (e) => {
    e.preventDefault();

    if (value === "people") {
      if (sidebarPeople) {
        removeItemFromLocalStorage(peopleKey);
        setSidebarPeople(false);
        setPeople({ display: "none" });
      } else {
        // Open People
        setItemToLocalStorage(peopleKey, true);
        setSidebarPeople(true);
        setPeople({ display: "block" });

        // Collapse Buses
        removeItemFromLocalStorage(busKey);
        setSidebarBuses(false);
        setMenu({ display: "none" });

        // Collapse Travels
        removeItemFromLocalStorage("travelsKey");
        setSidebarTravels(false);
        setTravelsMenu({ display: "none" });

        // Collapse Locations
        removeItemFromLocalStorage("locationsKey");
        setSidebarLocations(false);
        setLocationsMenu({ display: "none" });
      }
    } else if (value === "travels") {
      if (sidebarTravels) {
        removeItemFromLocalStorage("travelsKey");
        setSidebarTravels(false);
        setTravelsMenu({ display: "none" });
      } else {
        // Open Travels
        setItemToLocalStorage("travelsKey", true);
        setSidebarTravels(true);
        setTravelsMenu({ display: "block" });

        // Collapse Buses
        removeItemFromLocalStorage(busKey);
        setSidebarBuses(false);
        setMenu({ display: "none" });

        // Collapse People
        removeItemFromLocalStorage(peopleKey);
        setSidebarPeople(false);
        setPeople({ display: "none" });

        // Collapse Locations
        removeItemFromLocalStorage("locationsKey");
        setSidebarLocations(false);
        setLocationsMenu({ display: "none" });
      }
    } else if (value === "locations") {
      if (sidebarLocations) {
        removeItemFromLocalStorage("locationsKey");
        setSidebarLocations(false);
        setLocationsMenu({ display: "none" });
      } else {
        // Open Locations
        setItemToLocalStorage("locationsKey", true);
        setSidebarLocations(true);
        setLocationsMenu({ display: "block" });

        // Collapse Buses
        removeItemFromLocalStorage(busKey);
        setSidebarBuses(false);
        setMenu({ display: "none" });

        // Collapse People
        removeItemFromLocalStorage(peopleKey);
        setSidebarPeople(false);
        setPeople({ display: "none" });

        // Collapse Travels
        removeItemFromLocalStorage("travelsKey");
        setSidebarTravels(false);
        setTravelsMenu({ display: "none" });
      }
    } else {
      if (sidebarBuses) {
        removeItemFromLocalStorage(busKey);
        setSidebarBuses(false);
        setMenu({ display: "none" });
      } else {
        // Open Buses
        setItemToLocalStorage(busKey, true);
        setSidebarBuses(true);
        setMenu({ display: "block" });

        // Collapse People
        removeItemFromLocalStorage(peopleKey);
        setSidebarPeople(false);
        setPeople({ display: "none" });

        // Collapse Travels
        removeItemFromLocalStorage("travelsKey");
        setSidebarTravels(false);
        setTravelsMenu({ display: "none" });

        // Collapse Locations
        removeItemFromLocalStorage("locationsKey");
        setSidebarLocations(false);
        setLocationsMenu({ display: "none" });
      }
    }
  };

  const handleDeleteAllBuses = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Are you sure?",
      text: "You will delete all buses! This action cannot be reverted.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!"
    }).then(async result => {
      if (result.value) {
        const resp = await removeAllBuses().catch(err => {
          Swal.fire("Error", err.response && err.response.data && err.response.data.error ? err.response.data.error : "Something went wrong!", "error");
        });
        if (resp && resp.status === 200) {
          Swal.fire("Deleted!", `${resp.data.count || 0} buses have been deleted.`, "success");
          window.location.reload();
        }
      }
    });
  };

  const handleDeleteAllTravels = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Are you sure?",
      text: "You will delete all travels! This action cannot be reverted.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!"
    }).then(async result => {
      if (result.value) {
        const resp = await removeAllTravels().catch(err => {
          Swal.fire("Error", err.response && err.response.data && err.response.data.error ? err.response.data.error : "Something went wrong!", "error");
        });
        if (resp && resp.status === 200) {
          Swal.fire("Deleted!", `${resp.data.count || 0} travels have been deleted.`, "success");
          window.location.reload();
        }
      }
    });
  };

  const handleDeleteAllLocations = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Are you sure?",
      text: "You will delete all locations! This action cannot be reverted.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!"
    }).then(async result => {
      if (result.value) {
        const resp = await removeAllLocations().catch(err => {
          Swal.fire("Error", err.response && err.response.data && err.response.data.error ? err.response.data.error : "Something went wrong!", "error");
        });
        if (resp && resp.status === 200) {
          Swal.fire("Deleted!", `${resp.data.count || 0} locations have been deleted.`, "success");
          window.location.reload();
        }
      }
    });
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    if (signout()) {
      history.push("/");
    }
  };
  return (
    <>
      <aside className="main-sidebar">
        <section className="sidebar">
          <div className="user-panel">
            <div className="pull-left image">
              <Link to="/profile">
                <img
                  src={
                    user.avatar
                      ? `${SERVER_ROUTE}/uploads/${user.avatar}`
                      : defaultAdminImage
                  }
                  className="img-circle"
                  alt="UserImage"
                  style={{ cursor: "pointer" }}
                />
              </Link>
            </div>
            <div className="pull-left info">
              <p>{user.name}</p>
              <span className="role-badge">
                <i className="fa fa-circle text-success" style={{ marginRight: '4px' }}></i>
                {user.role}
              </span>
            </div>
            <div className="pull-right">
              <Link to="/profile/edit">
                <i
                  className="fa fa-pencil"
                  aria-hidden="true"
                  style={{ color: "#fff", padding: "1.5rem" }}
                ></i>
              </Link>
            </div>
          </div>

          {/* Greeting Badge */}
          <div className="sidebar-greeting">
            <span className="greeting-badge">
              <i className="fa fa-hand-peace-o" style={{ marginRight: '6px' }}></i>
              Namaste! {user.name}
            </span>
          </div>

          <ul className="sidebar-menu" data-widget="tree">
            <br />
            <li className={isActive(history, "/")}>
              <Link to="/">
                <i className="fa fa-tachometer"></i>
                <span>Dashboard</span>
              </Link>
            </li>



            <li className={isActive(history, "bus")}>
              <a href="false" onClick={toggleMenu("buses")}>
                <i className="fa fa-bus"></i> <span>My Buses</span>
                <span className="pull-right-container">
                  <i className="fa fa-angle-left pull-right"></i>
                </span>
              </a>
              <ul className="treeview-menu" style={menu}>
                {user.role === "superadmin" && (
                  <>
                    <li className={isActive(history, "/all-bus-available")}>
                      <Link to="/all-bus-available">
                        <i className="fa fa-circle-o"></i> All Available Buses
                        {/* <small className="label pull-right bg-blue">17</small> */}
                      </Link>
                    </li>
                  </>
                )}
                <li className={isActive(history, "/add-bus")}>
                  <Link to="/add-bus">
                    <i className="fa fa-plus"></i> Add new bus
                  </Link>
                </li>
                <li>
                  <a href="false" onClick={handleDeleteAllBuses} style={{ color: "#ef4444" }}>
                    <i className="fa fa-trash" style={{ color: "#ef4444" }}></i> Delete All Buses
                  </a>
                </li>
              </ul>
            </li>

            <li className={isActive(history, user.role === "superadmin" ? "/all-bookings" : "/my-bookings")}>
              <Link to={user.role === "superadmin" ? "/all-bookings" : "/my-bookings"}>
                <i className="fa fa-calendar"></i> <span>Bookings</span>
                <span className="pull-right-container">
                  <span className="badge-new">New</span>
                </span>
              </Link>
            </li>

            {user.role === "superadmin" && (
              <>
                <li className={isActive(history, "people")}>
                  <a href="false" onClick={toggleMenu("people")}>
                    <i className="fa fa-users"></i> <span>People</span>
                    <span className="pull-right-container">
                      <i className="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul className="treeview-menu" style={people}>
                    <li className={isActive(history, "/people-owners")}>
                      <Link to="/people-owners">
                        <i className="fa fa-circle-o"></i>Owners
                        {/* <small className="label pull-right bg-blue">17</small> */}
                      </Link>
                    </li>
                    <li className={isActive(history, "/people-users")}>
                      <Link to="/people-users">
                        <i className="fa fa-circle-o"></i>Users
                        {/* <small className="label pull-right bg-blue">17</small> */}
                      </Link>
                    </li>
                    <li className={isActive(history, "/people-guests")}>
                      <Link to="/people-guests">
                        <i className="fa fa-circle-o"></i>Guests
                        {/* <small className="label pull-right bg-blue">17</small> */}
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className={isActive(history, "location")}>
                  <a href="false" onClick={toggleMenu("locations")}>
                    <i className="fa fa-map-marker"></i> <span>Locations</span>
                    <span className="pull-right-container">
                      <i className="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul className="treeview-menu" style={locationsMenu}>
                    <li className={isActive(history, "/locations")}>
                      <Link to="/locations">
                        <i className="fa fa-circle-o"></i> All Locations
                      </Link>
                    </li>
                    <li className={isActive(history, "/add-location")}>
                      <Link to="/add-location">
                        <i className="fa fa-plus"></i> Add new location
                      </Link>
                    </li>
                    <li>
                      <a href="false" onClick={handleDeleteAllLocations} style={{ color: "#ef4444" }}>
                        <i className="fa fa-trash" style={{ color: "#ef4444" }}></i> Delete All Locations
                      </a>
                    </li>
                  </ul>
                </li>
                <li className={isActive(history, "travel")}>
                  <a href="false" onClick={toggleMenu("travels")}>
                    <i className="fa fa-building"></i> <span>Travels</span>
                    <span className="pull-right-container">
                      <i className="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul className="treeview-menu" style={travelsMenu}>
                    <li className={isActive(history, "/travels")}>
                      <Link to="/travels">
                        <i className="fa fa-circle-o"></i> All Travels
                      </Link>
                    </li>
                    <li className={isActive(history, "/add-travel")}>
                      <Link to="/add-travel">
                        <i className="fa fa-plus"></i> Add new travel
                      </Link>
                    </li>
                    <li>
                      <a href="false" onClick={handleDeleteAllTravels} style={{ color: "#ef4444" }}>
                        <i className="fa fa-trash" style={{ color: "#ef4444" }}></i> Delete All Travels
                      </a>
                    </li>
                  </ul>
                </li>
              </>
            )}

            <li>
              <a href="false" onClick={handleSignOut}>
                <i className="fa fa-sign-out"></i> <span>Logout</span>
              </a>
            </li>
          </ul>
        </section>
      </aside>
    </>
  );
});

export default withRouter(SideBar);
