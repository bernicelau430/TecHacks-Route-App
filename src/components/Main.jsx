import React, { Component } from 'react';
// This is the apiKey you stored earlier. Best practice is to keep it separated from your main file
import apiKey from '../api/apiKeys';
import {Spinner, Pane, TextInputField, SelectField, Button, toaster} from 'evergreen-ui';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

// This will indicate how large your map to be. You can input pixel amounts or percentages i.e. '100%',
const containerStyle = {
    width: '100%',
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
            algorithmOption: 'FUEL_EFFICIENCY',
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
        this.getAlgorithm = this.getAlgorithm.bind(this);
		// this.algorithm = this.algorithm.bind(this);
        this.fuelEfficientAlgorithm = this.fuelEfficientAlgorithm.bind(this);
        this.fastestAlgorithm = this.fastestAlgorithm.bind(this);
        this.distanceFactor = this.distanceFactor.bind(this);
        this.stepsFactor = this.stepsFactor.bind(this);
        this.elevationFactor = this.elevationFactor.bind(this);
    }

    componentDidMount() {
        this.algorithmOption = this.state.algorithmOption
    }
		// This ensures we only make 1 request as more requests is redundant and we don't wanna waste our monthly credits. Also console.logs the API response.
    async directionsCallback(response) {
        if (response !== null) {
            if (response.status === 'OK') {
                let manipulated_response;
                if (this.state.algorithmOption === 'FUEL_EFFICIENCY') {
                    manipulated_response = await this.fuelEfficientAlgorithm(response);
                    console.log(manipulated_response)
                }
                else {
                    manipulated_response = this.fastestAlgorithm(response);
                    console.log(manipulated_response)
                }
                // manipulated_response = this.algorithm(manipulated_response);
                this.setState({ response: manipulated_response });
								// Input your 2 locations and click submit. Right click and go to Chrome Developer Tools, and click console. You should be able to see the response you get from the Google Maps Api 
            } else {
              console.log('response: ', response)
            }
        }
        this.setState({ query: false });
    }

    fastestAlgorithm(response) {
        let returnedResponse = {...response};
        let leastDuration = response.routes[0].legs[0].duration.value;
        let bestRouteIndex = 0;
        response.routes.forEach((route, idx) => {
            let routeDuration = route.legs[0].duration.value;
            if (routeDuration < leastDuration) {
                leastDuration = routeDuration;
                bestRouteIndex = idx;
            }
        });
        returnedResponse.routes = [];
        returnedResponse.routes.push(response.routes[bestRouteIndex]);
        return returnedResponse;
    }

    async fuelEfficientAlgorithm(response) {
        let returnedResponse = {...response};
        const newResponse = response.routes.map(async (route, idx) => {
            let dFactor = this.distanceFactor(route);
            let sFactor = this.stepsFactor(route);
            const eFactor = await this.elevationFactor(route);
            console.log(dFactor, sFactor, eFactor)
            return dFactor * sFactor * eFactor;
        });
        return Promise.all(newResponse).then((values) => {
            returnedResponse.routes = [];
            returnedResponse.routes.push(response.routes[values.indexOf(Math.min(...values))]);
            return returnedResponse;
        })
    }

    distanceFactor(route) {
        return route.legs[0].distance.value/route.legs[0].duration.value;
    }

    stepsFactor(route) {
        let sumValue = 0;
        route.legs[0].steps.forEach((step) => {
            switch (step.maneuver) {
                case('turn-right'):
                    sumValue += 3;
                    break;
                case('turn-left'):
                    sumValue += 3;
                    break;
                case('keep-right'):
                    sumValue += 2;
                    break;
                case('keep-left'):
                    sumValue += 2;
                    break;
                case('ramp-right'):
                    sumValue += 2;
                    break;
                case('ramp-left'):
                    sumValue += 2;
                    break;
                default:
                    sumValue += 1;
            }
        })
        return sumValue;
    }

    async elevationFactor(route) {
        let url = 'https://elevation-api.io/api/elevation';
        let difference = 1;
        let points = [];
        route.legs[0].steps.forEach((step) => {
            points.push([step.start_location.lat(), step.start_location.lng()]);
            points.push([step.end_location.lat(), step.end_location.lng()]);
        })
        const dataString = {
            'points': points,
        }
        const request = new Request(url, {method: 'POST', headers: {'accept': 'application/json', 'content-type': 'application/json', 'elevation-api-key': 'U5d15-Yidw3pbEB00Wa8OOhLg1z2a3'}, body: JSON.stringify(dataString)})
        const response = await fetch(request);
        return response.json()
            .then((dataList) => {
                for(var i = 0; i < dataList.elevations.length - 1; i++) {
                    if ((dataList.elevations[i + 1].elevation - dataList.elevations[i].elevation) > 0) {
                        difference += (dataList.elevations[i + 1].elevation - dataList.elevations[i].elevation);
                    }
                }
                return difference;
            })
    }
		// This is where you will implement the algorithm i.e manipulate new_response
    /* algorithm(response) {
		let new_response = response;
        new_response.routes.forEach((route) => {

        });
        return new_response;
    } */
		
    getOrigin (ref) {
        this.origin = ref
      }
    
    getDestination (ref) {
        this.destination = ref
    }

    getAlgorithm(e) {
        this.algorithmOption = e.target.value
    }
		// Sends the required options such as origin, destination, and travelMode. Setting query to true will allow the GoogleMaps component to run.
    onClick() {
        if (this.origin.value !== '' && this.destination.value !== '') {
          this.setState(
            () => ({
                origin: this.origin.value,
                destination: this.destination.value,
                travelMode: this.state.travelMode,
                algorithmOption: this.algorithmOption.value,
                query: true,
            })
          )
        }
        else {
            toaster.danger('Something went wrong. Please enter a valid starting and ending location.')
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
                    {this.state.center != null ?
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
                        :
                        <Pane display = 'flex' alignItems = 'center' justifyContent = 'center' height = {400} >
                            <Spinner size = {64} />
                        </Pane>
                    }
                </LoadScript>
                    <Pane display = 'flex' elevation = {1} marginTop = {20} marginLeft = {20} flexDirection = 'column' padding = {25} background = 'tint2' alignItems = 'left' width = '50%' >
                        <TextInputField label = 'Origin:' ref = {this.getOrigin} description = 'Beginning Location' />
                        <TextInputField label = 'Destination:' ref = {this.getDestination} description = 'End Location' />
                        <SelectField label = 'Algorithm Option:' description = 'Select Algorithm' onChange = {e => this.getAlgorithm(e)} >
                            <option value = 'FUEL_EFFICIENCY'>
                                Fuel Efficiency
                            </option>
                            <option value = 'FASTEST'>
                                Fastest
                            </option>
                        </SelectField>
                        <Button appearance = 'primary' width = '25%' justifyContent = 'center' isLoading = {this.state.query} onClick = {this.onClick} >
                            Submit
                        </Button>
                    </Pane>
                    {/* <label>
                        Origin:
                    </label>
                    <input id="ORIGIN" type="text" value={this.state.value} ref={this.getOrigin} />
                    <label>
                        Destination:
                    </label>
                    <input id="DESTINATION" type="text" value={this.state.value} ref={this.getDestination} />
                    <label>
                        Option:
                    </label>
                    <select id="ALGORITHMOPTION" value={this.state.value} ref={this.getAlgorithm} > */}
                        {/*<option value="DRIVING">Driving</option>
                        <option value="BICYCLING">Biking</option>*/}
                        {/* <option value="FUEL_EFFICIENCY">Fuel Efficiency</option>
                        <option value="FASTEST">Fastest</option>
                    </select>
                    <button type="button" onClick={this.onClick}>
                        Submit
                    </button> */}
            </React.Fragment>
        )
    }
}

export default Main;