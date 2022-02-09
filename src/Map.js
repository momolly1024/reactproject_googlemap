import React, { useEffect, useState, useRef } from "react";
import GoogleMapReact from "google-map-react";
import { Key } from "./key"; // 引入 API key
import { debounce } from "lodash";
import _ from "lodash";
const Marker = ({ text }) => (
    <div style={{ color: "black", fontSize: "20px", fontWeight: "bold" }}>
        {text}
    </div>
);

const ResMarker = ({ icon, text, placeId, mapApi, mapInstance }) => {
    const [detailBox, setDetailBox] = useState(false);
    const [resDet, setResDet] = useState({});

    const Box = ({ name, score, open_now, url, phone }) => {
        console.log(resDet);
        return (
            <div
                style={{
                    border: "2px black solid",
                    backgroundColor: "white",
                    padding: "2px 2px 2px 6px",
                }}
            >
                <p>name: {name}</p>
                <p>score: {score}</p>
                <p>open_now {open_now ?? "not sure"}</p>
                <p>phone:{phone}</p>
                <a href={url} alt="" target="_blank" rel="noreferrer">
                    show on google map
                </a>
            </div>
        );
    };
    const onClick = () => {
        console.log(placeId);
        setDetailBox(!detailBox);
        const service = new mapApi.places.PlacesService(mapInstance);
        const request = {
            placeId,
            fields: [
                "name",
                "rating", // 評價
                "formatted_address", // 地址
                "formatted_phone_number", // 電話
                "geometry", // 幾何資訊
                "opening_hours", // 營業時間資訊
                "place_id",
                "url",
                "formatted_phone_number",
            ],
        };
        service.getDetails(request, (results, status) => {
            if (status === mapApi.places.PlacesServiceStatus.OK) {
                console.log(results); // 看看 results 會是什麼
                setResDet(results);
                // console.log(results.opening_hours.isOpen()); // 加入這一行，並再搜尋一次
            } else {
                console.log("error");
            }
        });
    };
    return (
        <div
            style={{
                width: "200px",
                fontWeight: "bold",
            }}
            onClick={onClick}
        >
            <img
                style={{ height: "16px", width: "16px", marginRight: "4px" }}
                src={icon}
                alt=""
            />
            <span
                style={{
                    border: "1px #D0D0D0 solid",
                    backgroundColor: "white",
                    padding: "4px",
                }}
            >
                {text}
            </span>
            {detailBox ? (
                <Box
                    open_now={resDet.open_now ?? null}
                    name={resDet.name}
                    score={resDet.rating}
                    url={resDet.url}
                    phone={resDet.formatted_phone_number}
                />
            ) : null}
        </div>
    );
};

const Map = (props) => {
    const [myPosition, setMyPosition] = useState({
        lat: 25.0968818,
        lng: 121.5144253,
    });

    const [mapApiLoaded, setMapApiLoaded] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapApi, setMapApi] = useState(null);
    const handleApiLoaded = (map, maps) => {
        // use map and maps objects
        console.log("載入完成!"); // 印出「載入完成」
    };
    // 當地圖載入完成，將地圖實體與地圖 API 傳入 state 供之後使用
    const apiHasLoaded = (map, maps) => {
        setMapInstance(map);
        setMapApi(maps);
        setMapApiLoaded(true);
    };
    // 移動地圖時 地點保持在 視角中心
    const handleCenterChange = () => {
        if (mapApiLoaded) {
            setMyPosition({
                // center.lat() 與 center.lng() 會回傳正中心的經緯度
                lat: mapInstance.center.lat(),
                lng: mapInstance.center.lng(),
            });
        }
    };

    // 找加油站在哪裡 -----------------------------
    // 抓到加油站在哪裡後 丟進去陣列中
    const [places, setPlaces] = useState([]);
    // 搜尋
    const [searchType, setSearchType] = useState("gas_station");
    console.log(mapApiLoaded);
    const findLocation = () => {
        if (mapApiLoaded) {
            const service = new mapApi.places.PlacesService(mapInstance);
            const request = {
                location: myPosition,
                radius: 2000,
                type: searchType,
            };

            service.nearbySearch(request, (results, status) => {
                if (status === mapApi.places.PlacesServiceStatus.OK) {
                    setPlaces(results);
                }
            });
        } else {
            console.log("loading failed");
        }
    };
    const [allList, setAllList] = useState([]);
    const getAllList = () => {
        if (mapApiLoaded) {
            const service = new mapApi.places.PlacesService(mapInstance);
            const request = {
                location: myPosition,
                radius: 6000,
                type: searchType,
            };

            service.nearbySearch(request, (results, status) => {
                if (status === mapApi.places.PlacesServiceStatus.OK) {
                    // setAllList(results);
                    console.log(results);
                }
            });
        } else {
            console.log("loading failed");
        }
    };
    useEffect(() => {
        getAllList();
    }, [mapApiLoaded]);
    // 做一個 Function 可以改變搜尋類型
    const handleSearchType = (e) => {
        setSearchType(e.target.name);
    };
    useEffect(() => {
        findLocation();
    }, [mapApiLoaded, searchType, myPosition]);

    // 打字搜尋 自動完成
    // 建立參考點
    let inputRef = useRef(null);
    // const showInputValue = () => console.log(inputRef.current.value);
    // 建立 state
    const [inputText, setInputText] = useState("");

    // 更改 state
    const handleInput = () => {
        setInputText(inputRef.current.value);
    };
    const [autocompleteResults, setAutocompleteResults] = useState([]);

    // 自動完成
    const handleAutocomplete = () => {
        if (mapApiLoaded) {
            const service = new mapApi.places.AutocompleteService();
            const request = {
                input: inputText,
            };

            service.getPlacePredictions(request, (results, status) => {
                if (status === mapApi.places.PlacesServiceStatus.OK) {
                    console.log(results);
                    setAutocompleteResults(results); // 寫入 state 供我們使用
                }
            });
        }
    };

    // 當 inputText 改變時，執行自動完成
    useEffect(() => {
        handleAutocomplete();
    }, [inputText]);

    // 點擊自動完成地址時，更改 MyPosition
    // const handleClickToChangeMyPosition = (e) => {
    //     const placeId = e.target.getAttribute("dataid");
    //     console.log(placeId);
    // };
    // 建立 state，供地圖本身做參考，以改變地圖視角
    const [currentCenter, setCurrentCenter] = useState({
        lat: 25.0968818,
        lng: 121.5144253,
    });

    // 點擊自動完成地址時，更改 MyPosition
    const handleClickToChangeMyPosition = (e) => {
        const placeId = e.target.getAttribute("dataid");

        const service = new mapApi.places.PlacesService(mapInstance);
        const request = {
            placeId,
            fields: [
                "name",
                "rating", // 評價
                "formatted_address", // 地址
                "formatted_phone_number", // 電話
                "geometry", // 幾何資訊
                "opening_hours", // 營業時間資訊
            ],
        };
        service.getDetails(request, (results, status) => {
            if (status === mapApi.places.PlacesServiceStatus.OK) {
                console.log(results); // 看看 results 會是什麼
                console.log(results.opening_hours.isOpen()); // 加入這一行，並再搜尋一次

                const newPosition = {
                    lat: results.geometry.location.lat(),
                    lng: results.geometry.location.lng(),
                };
                setCurrentCenter(newPosition);
                setMyPosition(newPosition);
                setAutocompleteResults([]);
                inputRef.current.value = "";
            }
        });
    };

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <div className="test">
                <div className="test1">
                    {" "}
                    <div onClick={handleSearchType}></div>
                    自動完成:
                    <input
                        ref={inputRef}
                        type="text"
                        onChange={debounce(handleInput, 500)}
                    />
                    <div onClick={handleClickToChangeMyPosition}>
                        {autocompleteResults && inputText
                            ? autocompleteResults.map((item) => (
                                  <div
                                      key={item.place_id}
                                      dataid={item.place_id}
                                      className="listResults"
                                  >
                                      {item.description}
                                  </div>
                              ))
                            : null}
                    </div>
                    <div>
                        <input
                            type="button"
                            value="加油站在哪～～"
                            name="gas_station"
                            onClick={handleSearchType}
                        />
                        <input
                            type="button"
                            value="餐廳在哪～～"
                            name="restaurant"
                            onClick={handleSearchType}
                        />
                        <input
                            type="button"
                            value="健身房"
                            name="gym"
                            onClick={handleSearchType}
                        />
                    </div>
                    <ul>
                        <li>1</li>
                        <li>1</li>
                        <li>1</li>
                        <li>1</li>
                    </ul>
                </div>
                <div className="test2">
                    <GoogleMapReact
                        bootstrapURLKeys={{
                            key: Key,
                            libraries: ["places"],
                        }}
                        center={currentCenter}
                        onChange={handleCenterChange}
                        defaultCenter={props.center}
                        defaultZoom={props.zoom}
                        yesIWantToUseGoogleMapApiInternals
                        onGoogleApiLoaded={({ map, maps }) =>
                            apiHasLoaded(map, maps)
                        }
                    >
                        <Marker
                            lat={myPosition.lat}
                            lng={myPosition.lng}
                            text="My Position"
                        />

                        {places.map((item, ix) => (
                            <ResMarker
                                icon={item.icon}
                                key={ix}
                                lat={item.geometry.location.lat()}
                                lng={item.geometry.location.lng()}
                                text={item.name}
                                placeId={item.place_id}
                                mapApi={mapApi}
                                mapInstance={mapInstance}
                            />
                        ))}
                    </GoogleMapReact>
                </div>
            </div>
        </div>
    );
};
// 給Map預設值
Map.defaultProps = {
    center: {
        lat: 25.0968818,
        lng: 121.5144253,
    },
    zoom: 15,
};
export default Map;
