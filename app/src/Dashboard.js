import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { saveAs } from "file-saver";
import axios from 'axios';
// Import the main component
import {
  highlightPlugin,
  HighlightArea,
  MessageIcon,
  RenderHighlightContentProps,
  RenderHighlightTargetProps,
} from '@react-pdf-viewer/highlight';
import { Button, Position, PrimaryButton, Tooltip, Viewer } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const Dashboard = () => {
  const [fileId, setFileId] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = React.useState('');
  const [modifiedTime, setModifiedTime] = React.useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [notes, setNotes] = React.useState([]);

  const fileInputRef = useRef(null);

  const openFile = async (event) => {
    event.preventDefault();
    setNotes([]);
    setMessage('');
    const file = event.target.files[0];
    setFileName(file.name);
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('http://52.14.10.10/api/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (response.data.success) {
          setFileId(response.data.id);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const saveFile = async () => {
    await axios.post(`http://52.14.10.10/api/highlight/${fileId}/`, { data: notes }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(
      response => {
      }
    ).catch((error) => {
      console.error(error);
    })
    await fetch(`http://52.14.10.10/api/view/${fileId}/`)
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, fileName);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  let noteId = notes.length;

  const renderHighlightTarget = (props) => (
    <div
      style={{
        background: '#eee',
        display: 'flex',
        position: 'absolute',
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: 'translate(0, 8px)',
        zIndex: 1,
      }}
    >
      <Tooltip
        position={Position.TopCenter}
        target={
          <Button onClick={() => { props.toggle(); }}>
            <MessageIcon />
          </Button>
        }
        content={() => <div style={{ width: '100px' }}>Add a note</div>}
        offset={{ left: 0, top: -8 }}
      />
    </div>
  );

  const renderHighlightContent = (props) => {
    const addNote = () => {
      if (message !== '') {
        const note = {
          id: ++noteId,
          content: message,
          highlightAreas: props.highlightAreas,
          quote: props.selectedText,
        };
        setNotes(notes.concat([note]));
        props.cancel();
      }
    };

    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(0, 0, 0, .3)',
          borderRadius: '2px',
          padding: '8px',
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1,
        }}
      >
        <div>
          <textarea
            rows={3}
            style={{
              border: '1px solid rgba(0, 0, 0, .3)',
            }}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: '8px',
          }}
        >
          <div style={{ marginRight: '8px' }}>
            <PrimaryButton onClick={addNote}>Add</PrimaryButton>
          </div>
          <Button onClick={props.cancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderHighlights = (props) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => (
              <div
                key={idx}
                style={Object.assign(
                  {},
                  {
                    background: 'yellow',
                    opacity: 0.4,
                  },
                  props.getCssProperties(area, props.rotation)
                )}
              />
            ))}
        </React.Fragment>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights,
  });

  useEffect(() => {
    if (fileId) {
      const eventSource = new EventSource(`http://52.14.10.10/api/check_modified/${fileId}/`);

      eventSource.onmessage = (event) => {
        if (event.data) {
          setModifiedTime(event.data);
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [fileId]);

  const handlePageChanged = (e) => {
    setPageNumber(e.currentPage);
  }

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      <div style={{ backgroundColor: "#f2f2f2", width: "20%", padding: "20px" }}>
        <button style={{ width: "250px", height: "30px" }} onClick={() => fileInputRef.current.click()}>Open File</button>
        <input type="file" onChange={openFile} accept=".pdf" hidden ref={fileInputRef} />
        {fileId && (
          <>
            <button style={{ width: "250px", height: "30px" }} onClick={saveFile}>Save PDF File</button>
          </>
        )}
      </div>

      <div style={{ width: "80%", padding: "20px", position: "relative", overflow: "auto" }}>
        {
          fileId && (
            <Viewer
              fileUrl={`http://52.14.10.10/api/view/${fileId}/`}
              plugins={[highlightPluginInstance]}
              key={modifiedTime}
              onPageChange={handlePageChanged}
              initialPage={pageNumber}
            />
          )
        }
      </div>
    </div >
  );
};

export default Dashboard;