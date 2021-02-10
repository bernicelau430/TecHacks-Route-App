import React, { Component } from 'react';
// This is the apiKey you stored earlier. Best practice is to keep it separated from your main file
import apiKey from '../api/apiKeys';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

// This will indicate how large your map to be. You can input pixel amounts or percentages i.e. '100%',
const containerStyle = {
    width: '400px',
    height: '400px'
  };

class Main extends Component {
    constructor(props) {
        super(props);
				// This will control they options you can input into your API request. 
				// Implore you to read this: https://developers.google.com/maps/documentation/javascript/directions#Directions to understand the additional options you can input and how to read the response object.
        this.state = {
            showDirection: false,
            response: null,
            travelMode: 'DRIVING',
            origin: '',
            destination: '',
            query: false,
            center: null,
        }
        this.directionsCallback = this.directionsCallback.bind(this);
        this.getOrigin = this.getOrigin.bind(this);
        this.getDestination = this.getDestination.bind(this);
        this.onClick = this.onClick.bind(this);
        this.directionsCallback = this.directionsCallback.bind(this);
        this.getPosition = this.getPosition.bind(this);
        this.getTravelMode = this.getTravelMode.bind(this);
		this.algorithm = this.algorithm.bind(this);
    }

		// This ensures we only make 1 request as more requests is redundant and we don't wanna waste our monthly credits. Also console.logs the API response.
    directionsCallback(response) {
        this.setState({ query: false });
        if (response !== null) {
            if (response.status === 'OK') {
                let manipulated_response = response;
                manipulated_response = this.algorithm(manipulated_response);
                this.setState({ response: manipulated_response });
								// Input your 2 locations and click submit. Right click and go to Chrome Developer Tools, and click console. You should be able to see the response you get from the Google Maps Api 
								console.log(response);
            } else {
              console.log('response: ', response)
            }
        }
    }
		// This is where you will implement the algorithm i.e manipulate new_response
    algorithm(response) {
				let new_response = response;
        return new_response;
    }
		
    getOrigin (ref) {
        this.origin = ref
      }
    
    getDestination (ref) {
        this.destination = ref
    }

    getTravelMode(ref) {
        this.travelMode = ref
    }
		// Sends the required options such as origin, destination, and travelMode. Setting query to true will allow the GoogleMaps component to run.
    onClick() {
        if (this.origin.value !== '' && this.destination.value !== '') {
          this.setState(
            () => ({
                origin: this.origin.value,
                destination: this.destination.value,
                travelMode: this.travelMode.value,
                query: true,
            })
          )
        }
    }
		// This is added because I thought it would interesting to include some geolocation. i.e The map will take in your current position if you give it your location before you input anything.
		// This Promise object makes sure we only continue loading the Map once we have your geolocation.
    getPosition() {
        return new Promise(function (resolve, reject) {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }

    render() {
				// Takes in your position and sets it to this.state.center. This will be used by the GoogleMap component to center the screen at a lat and lng.
        if (this.state.center == null) {
            this.getPosition()
                .then((position) => {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    }
                    this.setState({ center: pos });
                })
                .catch((err) => {
                    this.setState({
                        center: {
                            lat: -3.745,
                            lng: -38.523,
                        }
                    })
                });
        }
        return (
            <React.Fragment>
								{/* Loads your apiKey */}
                <LoadScript
                    googleMapsApiKey={apiKey}
                >
                    {this.state.center != null &&
                        <GoogleMap
                            id='direction-example'
                            mapContainerStyle={containerStyle}
                            zoom={15}
                            center={this.state.center}
                        >
                            {
                                (
                                    this.state.destination !== '' &&
                                    this.state.origin !== '' && this.state.query
                                )
                                && (
                                    <DirectionsService
                                        options={{
                                            provideRouteAlternatives: true,
                                            destination: this.state.destination,
                                            origin: this.state.origin,
                                            travelMode: this.state.travelMode
                                        }}
                                        callback={this.directionsCallback}
                                    />
                                )
                            }
                            {
                                this.state.response !== null && (
                                    <DirectionsRenderer
                                        options={{
                                            directions: this.state.response
                                        }}
                                    />
                                )
                            }
                        </GoogleMap>
                    }
                </LoadScript>
                    <label>
                        Origin:
                    </label>
                    <input id="ORIGIN" type="text" value={this.state.value} ref={this.getOrigin} />
                    <label>
                        Destination:
                    </label>
                    <input id="DESTINATION" type="text" value={this.state.value} ref={this.getDestination} />
                    <label>
                        Travel Mode:
                    </label>
                    <select id="TRAVELMODE" value={this.state.value} ref={this.getTravelMode} >
                        <option value="DRIVING">Driving</option>
                        <option value="BICYCLING">Biking</option>
                        <option value="TRANSIT">Transit</option>
                        <option value="WALKING">Walking</option>
                    </select>
                    <button type="button" onClick={this.onClick}>
                        Submit
                    </button>
            </React.Fragment>
        )
    }
}

export default Main;