import {useState, useEffect} from "react";

function TrafficDiv({node}){
    return(
        <div>
            {/* <p>Node retrieved for ${node.suburb}, ${node.postcode} with longitude: {node.longitude} and latitude: ${node.latitude}</p>
            <p>${node.description}</p> */}
            <img src={node.image} alt={node.description} width="360" height="240"/> 
        </div>
)}

async function trafficList(resolution){    
   
    let options = {
        method:"GET",
        mode:"cors",
    }

   let requestURL = `/api/traffic/${(resolution===null||resolution===undefined)?"High":resolution}`
    console.log(`Accessing url: ${requestURL}`)
    const result = await fetch(requestURL,options)        
        .then(response => {
            console.log(`Status code: ${response.status} reponse is ${response.statusText}`) 
            return response.json()
            
        })
        .then(data=>{
            console.log(`${data.length} events fetched from server`) 
            return data
        })       
        .catch(error => {
            console.log(`There was an error fetching data from ${requestURL} in trafficList()`)
            return [error]
        })

    const nodes = result.map((event=>{                    
        event.popup = <TrafficDiv node={event}/>
        return event       
    }))
    console.log(`The number of traffic events in output is ${nodes.length}`)
    
    return nodes   
}

export function useTrafficNodes(resolution,callback){
    const [loading,setLoading] = useState(true);
    const [markers, setMarkers] = useState([])
    const [error,setError] = useState(null)

    useEffect(()=>{  
        (async () =>{  
            try{ 
                console.log("Attempting to fetch traffic data...")
                const events = await trafficList(resolution)
                setMarkers(events)                                 
                const interval = setInterval(async ()=>{
                    setMarkers([])
                    callback(markers)
                    console.log(`The resolution is ${resolution} at point of interval execution`)
                    if(resolution!==undefined){
                        let events = await trafficList(resolution)
                        setMarkers(events)                
                    }
                },60000)
                console.log(`There are ${events.length} events in variable events and there are ${markers.length} in nodes`)
                return () => clearInterval(interval);
                
            }catch(e){                
                console.log(`An error was invoked in useTrafficNodes: ${e}!`);
                setError(e);                
            }finally{
                if(markers===undefined){
                    console.log("Did not receive any traffic data")
                    setMarkers([])
                }
                console.log("About to set callback and loading values...")
                callback(markers)
                setLoading(false);            
            }
        })();
    },[resolution]);
    return {loading,markers,error} 
}

 