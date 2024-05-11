import './App.css';
import "./styles.css";
import "leaflet/dist/leaflet.css"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useTrafficNodes } from './api/traffic-methods';
import {useState,useEffect,useContext} from "react";
import {FormControl,InputLabel,Select,MenuItem,SelectChangeEvent  } from '@mui/material'

function App() {
  const [resolution, setResolution] = useState("")  
  
  const handleChange = (event) => {
    if(event.target.value!=="" && event.target.value!==undefined && event.target.value!==resolution){
      console.log(`Setting resolution to: ${event.target.value}`);
      setResolution(event.target.value);
    }
  };

  const [isMarker,setIsMarker] = useState(false);

  const haveMarkers = (data)=>{
    if(data.length>0){
      console.log(`Setting IsMarker to true since the length of data is: ${data.length} which is > 0.`);
      setIsMarker(true);
    }else{
      console.log(`Setting IsMarker to false since there is no data.`);
      setIsMarker(false);
    }
  }

  const { loading, markers, error } = useTrafficNodes(resolution,haveMarkers);
  
  if (loading){    
    return <p>Loading... </p>;
  }  
  
 



  

  function MyMap({markers, isMarkers}){
    console.log(`At entry of MyMap component do we have markers? ${isMarkers}`)
    const customIcon = new Icon({
      iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg",
      iconSize: [58, 58]
    })

    const createCustomClusterIcon = (cluster) => {
      return (
        new divIcon({
          html: `<div class="cluster-icon"> ${cluster.getChildCount()} </div>`,
          className: "custom-marker-cluster",
  
        })
      )
    }
    let center = [-27.4705, 153.0260]
    let zoomLevel = 12
    let mapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreeMap</a> contributors'
    let mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    if(isMarkers){
      console.log(`We have ${markers.length} in MyMap Component`)      
      return(
        <div>          
          <MapContainer center={center} zoom={zoomLevel}>
            <TileLayer attribution={mapAttribution} url= {mapUrl}/>         
            <MarkerClusterGroup chunkedLoading iconCreateFunction={createCustomClusterIcon}>
              {markers.map((marker) => (              
                <Marker position={[marker.latitude,marker.longitude]} icon={customIcon}>
                  <Popup maxWidth="365" maxHeight="245">{marker.popup}</Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>        
          </MapContainer>
        </div>
      )
    } else{
      return(
        <div>          
          <MapContainer center={center} zoom={zoomLevel}>
            <TileLayer attribution={mapAttribution} url= {mapUrl}/>                   
          </MapContainer>
        </div>
      )
    }

  }

  function MySlider({resolution,callback}){
    return(
      <FormControl fullWidth>
        <InputLabel id="resolution-select">Resolution</InputLabel>
        <Select
          labelId="resolution-select"
          id="resolution-select"
          value={resolution}
          label="Resolution"
          onChange={callback}
          >
          <MenuItem value=""><em>None</em></MenuItem>
          <MenuItem value={"Low"}>Low</MenuItem>
          <MenuItem value={"Medium"}>Medium</MenuItem>
          <MenuItem value={"High"}>High</MenuItem>
        </Select>
      </FormControl>
    )

  }
 
    return (
      <div className="App">
      <p> Traffic Density App </p>
      <MySlider resolution={resolution} callback={handleChange}/>
      <MyMap markers={markers} isMarkers={isMarker}/>


    </div>
  ); 
}

export default App;