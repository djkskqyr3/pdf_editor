# pdf_editor

### Upload PDF

```
 POST api/upload/
```

The `Content-Type` type should be `multipart/form-data`.


| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `file` | `File` | **Required** PDF file to upload |

**Response:** 

```
{
  "id": Uuid,                   // created file id
  "success": Bool,              // true or false
}
```

**Example:** 

```
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('http://localhost:3000/api/upload/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
if (response.data.success) {
  // response.data.id
}
```

### Server Sent Event

```
  http://localhost:3000/api/check_modified/:file_id/
```

### Apply Changes

```
 POST api/highlight/:file_id/
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `data` | `HighlightData[]` | **Required** highlight details |

**HighlightData:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `int` | **Required** index |
| `content` | `String` | **Required** comments |
| `highlightAreas` | `HighlightArea[]` | **Required** highlight area |

**HighlightArea:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `pageIndex` | `int` | **Required** page index |
| `top` | `Float` | **Required** top of highlight |
| `left` | `Float` | **Required** left of highlight |
| `width` | `Float` | **Required** width of highlight |
| `height` | `Float` | **Required** height of highlight |

**Response:** 

```
{
  "success": Bool,              // true or false
}
```

**Example:** 

```
  http://localhost:3000/api/highlight/ebc964bb-a572-4e2a-8f43-eb52509fa748/

  {
    "data": [
      {
        "id": 1,
        "content": "this is test comment",
        "highlightAreas": [
          {
            "height": 1.7676766354044537,
            "left": 5.87980412651755,
            "pageIndex": 1,
            "top": 10.852668597327227,
            "width": 37.44046158334992
          }
        ]
      }
    ]
  }
```

### Save PDF

```
 GET api/view/:file_id/
```

**Example:** 

```
  await fetch(`http://localhost:3000/api/view/ebc964bb-a572-4e2a-8f43-eb52509fa748/`)
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, fileName);
      })
      .catch((error) => {
        console.error(error);
      });
```
