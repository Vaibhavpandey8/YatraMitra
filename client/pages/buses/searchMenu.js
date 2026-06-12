import { Select, Button, Input } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
import { getAllLocations } from "../../actions/location";
import Router from "next/router";

const { Option } = Select;

function onBlur() {
  console.log("blur");
}

function onFocus() {
  console.log("focus");
}

function onSearch(val) {
  console.log("search:", val);
}

function disabledDate(current) {
  // Can not select days before today and today
  return current && current < moment().endOf("day");
}

const SearchMenu = ({ buses, info }) => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    startLocation: info.startLocation,
    endLocation: info.endLocation
  });

  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
  ];

  const getStateName = (district) => {
    if (!district) return "";
    const prefix = district.split(" - ")[0].trim().toLowerCase();
    if (prefix === "delhi") return "Delhi";
    if (prefix === "up") return "Uttar Pradesh";
    if (prefix === "rajasthan") return "Rajasthan";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  const getUniqueStates = () => {
    const unique = new Set(INDIAN_STATES);
    locations.forEach(l => {
      const state = getStateName(l.district);
      if (state) unique.add(state);
    });
    return Array.from(unique).sort();
  };

  const uniqueStates = getUniqueStates();

  const onChangeFrom = val => {
    setFormData({ ...formData, ...{ startLocation: val } });
  };

  const onChangeTo = val => {
    setFormData({ ...formData, ...{ endLocation: val } });
  };

  const routeTransition = () => {
    Router.push({
      pathname: "/buses",
      query: formData
    });
  };

  useEffect(() => {
    fetchAllLocations();
  }, []);

  const fetchAllLocations = async () => {
    const locs = await getAllLocations();
    setLocations(locs || []);
    
    const resolveToState = (val, list) => {
      const match = list.find(l => l._id === val);
      if (match) {
        return getStateName(match.district);
      }
      return val;
    };
    
    setFormData(prev => ({
      ...prev,
      startLocation: resolveToState(info.startLocation, locs),
      endLocation: resolveToState(info.endLocation, locs)
    }));
  };

  return (
    <div className="route-form bus-search-menu m-1">
      <label htmlFor="">
        <h4 className="color-white">From: </h4>
      </label>
      <Select
        showSearch
        value={formData.startLocation}
        style={{ width: 200, marginRight: "1rem" }}
        placeholder="eg- Delhi"
        optionFilterProp="children"
        onChange={onChangeFrom}
        onFocus={onFocus}
        onBlur={onBlur}
        onSearch={onSearch}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {uniqueStates.filter(state => state !== formData.endLocation).map(state => (
          <Option value={state} key={state}>
            {state}
          </Option>
        ))}
      </Select>
      <label htmlFor="">
        <h4 className="color-white">To: </h4>
      </label>
      <Select
        showSearch
        value={formData.endLocation}
        style={{ width: 200, marginRight: "1rem" }}
        placeholder="eg- Uttar Pradesh"
        optionFilterProp="children"
        onChange={onChangeTo}
        onFocus={onFocus}
        onBlur={onBlur}
        onSearch={onSearch}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {uniqueStates.filter(state => state !== formData.startLocation).map(state => (
          <Option value={state} key={state}>
            {state}
          </Option>
        ))}
      </Select>
      <Button
        type="primary"
        icon="search"
        style={{ marginLeft: "1rem" }}
        onClick={routeTransition}
      >
        Search
      </Button>
    </div>
  );
};

export default SearchMenu;
