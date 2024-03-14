import { useState, useEffect, useContext } from "react";
import { CoordinateFormat } from "../../enums";
import {
	Coordinates,
	DecimalDegreeCoordinate,
} from "../../models/Coordinates";
import { ConvertCoordinates } from "../../utils/coordinates/coordinateConverter";
import { ParseCoordinates } from "../../utils/coordinates/coordinateParser";
import { ConvertCoordinatesToGeoJson } from "../../utils/geoJson/ddCoordinatesToGeoJson";
import { GeoJsonContext } from "../context/GeoJson";
import { GetCoordinateHelperText } from "../strings/HelperText";

const enum text {
	utmCoordinateXPlaceholder = "Easting",
	utmCoordinateYPlaceholder = "Northing",
	decimalDegreesCoordinateXPlaceholder = "Latitude",
	decimalDegreesCoordinateYPlaceholder = "Longitude",
	degreesMinutesSecondsXPlaceholder = "(N/S) Latitude",
	degreesMinutesSecondsYPlaceholder = "(W/E) Longitude",
}

const CoordinateInput = () => {
	const { setGeoJson } = useContext(GeoJsonContext);

	const coordinateDropdownOptions = [
		{ value: CoordinateFormat.DecimalDegrees, label: "Decimal Degrees" },
		{
			value: CoordinateFormat.DegreesMinutesSeconds,
			label: "Degrees Minutes Seconds",
		},
		{
			value: CoordinateFormat.UniversalTransverseMercator,
			label: "Universal Transverse Mercator (UTM)",
		},
	];

	const [showHelperText, setShowHelperText] = useState<boolean>(true);
	const [helperText, setHelperText] = useState("");
	const [showError, setShowError] = useState<boolean>(false);
	const [errorText, setErrorText] = useState<string>("");
	const [showTextFieldError, setShowTextFieldError] = useState<boolean>(false);
	const [textFieldErrorText, setTextFieldErrorText] = useState<string>("");

	const [currentFormat, setCurrentFormat] = useState<CoordinateFormat>(
		CoordinateFormat.DecimalDegrees
	);

	const [coordinates, setCoordinates] = useState<Coordinates>({
		zoneNumber: "",
		zoneLetter: "",
		coordinateX: "",
		coordinateY: "",
	});

	const [coordinatesTextField, setCoordinatesTextField] = useState<string>("");

	useEffect(() => {
		setHelperText(GetCoordinateHelperText(currentFormat));
	}, []);

	const changeFormat = (event: any) => {
		setGeoJson(null);
		setCurrentFormat(event.target.value);
		setCoordinatesTextField("");
		setCoordinates({
			coordinateX: "",
			coordinateY: "",
			zoneNumber: coordinates.zoneNumber,
			zoneLetter: coordinates.zoneLetter,
		});
		setHelperText(GetCoordinateHelperText(event.target.value));
	};

	const handleCoordinateInputChange = (event: any) => {
		const { name, value } = event.target;
		setCoordinates({
			...coordinates,
			[name]: value,
		});
	};

	const handleCoordinateTextAreaInputChange = (event: any) => {
		setCoordinatesTextField(event.target.value);
	};

	const addCoordinates = () => {
		setShowError(false);
		setErrorText("");
		if (coordinates.coordinateX === "" || coordinates.coordinateY === "") {
			setErrorText("Please enter both coordinates.");
			setShowError(true);
			return;
		}

		if (currentFormat === CoordinateFormat.UniversalTransverseMercator) {
			if (coordinates.zoneNumber === "" || coordinates.zoneLetter === "") {
				setErrorText("Please enter the zone number and the zone letter.");
				setShowError(true);
				return;
			}

			setCoordinatesTextField(
				coordinatesTextField +
					"[" +
					coordinates.zoneNumber +
					"," +
					coordinates.zoneLetter +
					"," +
					coordinates.coordinateX +
					"," +
					coordinates.coordinateY +
					"],\n"
			);
		} else if (currentFormat === CoordinateFormat.DegreesMinutesSeconds) {
			setCoordinatesTextField(
				coordinatesTextField +
					"[" +
					coordinates.coordinateX +
					"," +
					coordinates.coordinateY +
					"],\n"
			);
		} else if (currentFormat === CoordinateFormat.DecimalDegrees) {
			setCoordinatesTextField(
				coordinatesTextField +
					"[" +
					coordinates.coordinateX +
					"," +
					coordinates.coordinateY +
					"],\n"
			);
		}

		setCoordinates({
			coordinateX: "",
			coordinateY: "",
			zoneLetter: coordinates.zoneLetter,
			zoneNumber: coordinates.zoneNumber,
		});
	};

	const convertToGeoJson = () => {
		setShowTextFieldError(false);
		setTextFieldErrorText("");

		var coordinatesForGeoJson: DecimalDegreeCoordinate[] = [];

		var { parsedCoordinates, err: parsedCoordinatesErr } = ParseCoordinates(
			coordinatesTextField,
			currentFormat
		);

		if (parsedCoordinatesErr !== null) {
			setShowTextFieldError(true);
			setTextFieldErrorText(parsedCoordinatesErr);
			console.log(parsedCoordinatesErr);
			return;
		} else {
			if (parsedCoordinates !== null) {
				if (currentFormat !== CoordinateFormat.DecimalDegrees) {
					var { coordinates, err: convertCoordinatesErr } = ConvertCoordinates(
						parsedCoordinates,
						currentFormat,
						CoordinateFormat.DecimalDegrees
					);

					if (convertCoordinatesErr !== null) {
						console.log("Error converting coordinates: " + convertCoordinatesErr);
					} else {
						coordinatesForGeoJson = coordinates;
					}
				} else {
					coordinatesForGeoJson =
						parsedCoordinates as DecimalDegreeCoordinate[];
				}
			}
		}

		const {
			geoJson: geoJsonFromCoordinates,
			err: convertCoordinatesToGeoJsonErr,
		}: { geoJson: any | null; err: string | null } =
			ConvertCoordinatesToGeoJson(coordinatesForGeoJson);

		if (convertCoordinatesToGeoJsonErr === null) {
			setGeoJson(geoJsonFromCoordinates);
		} else {
			setShowTextFieldError(true);
			setTextFieldErrorText(convertCoordinatesToGeoJsonErr);
			console.log(convertCoordinatesToGeoJsonErr);
		}
		
	};

	return (
		<>
			<div className="row">
				<div className="col">
					<form>
						<div className="form-group">
							<label htmlFor="coordinateFormatSelector">
								Coordinate format
							</label>
							<select
								className="form-control"
								id="coordinateFormatSelector"
								onChange={changeFormat}
							>
								{coordinateDropdownOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							{helperText !== "" ? (
								<button
									className="btn btn-link"
									style={{ padding: "0", fontSize: "14px" }}
									onClick={() => setShowHelperText(!showHelperText)}
									type="button"
								>
									{showHelperText ? "Hide guide" : "Show guide"}
								</button>
							) : (
								<></>
							)}
						</div>
					</form>
				</div>
			</div>
			{/* HELPER TEXT */}
			{helperText !== "" && showHelperText ? (
				<div className="row">
					<div className="col">
						<div className="row">
							<div className="col">
								<div
									className="callout"
									style={{ marginTop: "0", fontSize: "14px" }}
								>
									{helperText}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<></>
			)}

			<div className="row">
				<div className="col form-group">
					<form>
						<div className="row">
							<div
								className="col-2 coordinateInput"
								style={
									currentFormat === CoordinateFormat.UniversalTransverseMercator
										? { display: "block" }
										: { display: "none" }
								}
							>
								<input
									type="text"
									className="form-control"
									placeholder="#"
									title="Zone number"
									name="zoneNumber"
									onChange={handleCoordinateInputChange}
									value={coordinates.zoneNumber}
								/>
							</div>
							<div
								className="col-2 coordinateInput"
								style={
									currentFormat === CoordinateFormat.UniversalTransverseMercator
										? { display: "block" }
										: { display: "none" }
								}
							>
								<input
									type="text"
									className="form-control"
									placeholder="L"
									title="Zone letter"
									name="zoneLetter"
									onChange={handleCoordinateInputChange}
									value={coordinates.zoneLetter}
								/>
							</div>
							<div className="col coordinateInput">
								<input
									type="text"
									className="form-control"
									placeholder={
										currentFormat ===
										CoordinateFormat.UniversalTransverseMercator
											? text.utmCoordinateXPlaceholder
											: currentFormat === CoordinateFormat.DegreesMinutesSeconds
											? text.degreesMinutesSecondsXPlaceholder
											: text.decimalDegreesCoordinateXPlaceholder
									}
									name="coordinateX"
									onChange={handleCoordinateInputChange}
									value={coordinates.coordinateX}
								/>
							</div>
							<div className="col coordinateInput">
								<input
									type="text"
									className="form-control"
									placeholder={
										currentFormat ===
										CoordinateFormat.UniversalTransverseMercator
											? text.utmCoordinateYPlaceholder
											: currentFormat === CoordinateFormat.DegreesMinutesSeconds
											? text.degreesMinutesSecondsYPlaceholder
											: text.decimalDegreesCoordinateYPlaceholder
									}
									name="coordinateY"
									onChange={handleCoordinateInputChange}
									value={coordinates.coordinateY}
								/>
							</div>
							<div className="col-2">
								<button
									type="button"
									className="btn btn-primary"
									onClick={addCoordinates}
								>
									Add
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
			{showError ? (
				<div className="row" id="coordinateInputError">
					<div className="col">
						<p id="coordinateInputErrorText" style={{ color: "red" }}>
							{errorText}
						</p>
					</div>
				</div>
			) : (
				<></>
			)}
			<div className="row">
				<div className="col">
					<textarea
						className="form-control coordinatesTextField"
						aria-label="With textarea"
						id="coordinateTextField"
						value={coordinatesTextField}
						onChange={handleCoordinateTextAreaInputChange}
					></textarea>
				</div>
			</div>
			{showTextFieldError ? (
				<div className="row" id="coordinateInputError">
					<div className="col">
						<p id="coordinateInputErrorText" style={{ color: "red" }}>
							{textFieldErrorText}
						</p>
					</div>
				</div>
			) : (
				<></>
			)}
			<div className="row" style={{ marginTop: "16px" }}>
				<div className="col">
					<button
						type="button"
						className="btn btn-primary"
						onClick={convertToGeoJson}
					>
						Convert to GeoJSON
					</button>
				</div>
			</div>
		</>
	);
};

export default CoordinateInput;
