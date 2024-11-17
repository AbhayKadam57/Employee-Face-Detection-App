import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const EmployeeDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [employeeDetected, setEmployeeDetected] = useState(false);
  const [recognitionStarted, setRecognitionStarted] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load Face API models from the public/models directory
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setIsModelLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Error loading models:", err);
      }
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      }
    };

    loadModels();
  }, []);

  const startRecognition = () => {
    if (!isModelLoaded) {
      alert("Models are not loaded yet. Please wait.");
      return;
    }
    setRecognitionStarted(true);

    // Set a timeout to alert if the employee is not detected in 40 seconds
    const timeout = setTimeout(() => {
      if (!employeeDetected) {
        alert("Failed to detect the employee within 40 seconds.");
        setRecognitionStarted(false); // Stop recognition
      }
    }, 40000);

    const detectEmployee = async () => {
      const video = videoRef.current;

      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        const labeledDescriptors = await loadLabeledImages();
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        detections.forEach((detection) => {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          //   if (bestMatch.label === "Abhay Kadam") {
          //     setEmployeeDetected(true);
          //     clearTimeout(timeout); // Stop timeout when employee is detected
          //   }
          if (bestMatch.label === "Abhay Kadam") {
            setEmployeeDetected("Abhay Kadam detected!");
          } else if (bestMatch.label === "Aditi Kotecha") {
            setEmployeeDetected("Aditi Kotecha detected!");
          } else {
            setEmployeeDetected(false);
          }
        });
      }

      if (recognitionStarted) {
        requestAnimationFrame(detectEmployee);
      }
    };

    detectEmployee();
  };

  //   const loadLabeledImages = async () => {
  //     const descriptions = [];
  //     const img = await faceapi.fetchImage("/labeled_images/AbhayKadam.jpg");
  //     const detection = await faceapi
  //       .detectSingleFace(img)
  //       .withFaceLandmarks()
  //       .withFaceDescriptor();

  //     if (detection) descriptions.push(detection.descriptor);

  //     return [new faceapi.LabeledFaceDescriptors("Abhay Kadam", descriptions)];
  //   };
  const loadLabeledImages = async () => {
    const employees = [
      { name: "Abhay Kadam", image: "/labeled_images/AbhayKadam.jpg" },
      { name: "Aditi Kotecha", image: "/labeled_images/AditiKotechaa.jpg" },
    ];

    const labeledDescriptors = [];

    for (const employee of employees) {
      const descriptions = [];
      const img = await faceapi.fetchImage(employee.image);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        descriptions.push(detection.descriptor);
      }

      labeledDescriptors.push(
        new faceapi.LabeledFaceDescriptors(employee.name, descriptions)
      );
    }

    return labeledDescriptors;
  };

  return (
    <div>
      <h1>Employee Detection</h1>
      {!isModelLoaded && <p>Loading models...</p>}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "600px", border: "1px solid black" }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute" }} />
      {employeeDetected ? (
        <h2 style={{ color: "green" }}>{employeeDetected}</h2>
      ) : (
        recognitionStarted && (
          <h2 style={{ color: "red" }}>Searching for Employee...</h2>
        )
      )}
      <button onClick={startRecognition} disabled={recognitionStarted}>
        {recognitionStarted
          ? "Recognition in Progress..."
          : "Start Recognition"}
      </button>
    </div>
  );
};

export default EmployeeDetection;
