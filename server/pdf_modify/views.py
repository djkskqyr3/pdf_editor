from django.http import JsonResponse, HttpResponseNotFound, FileResponse, StreamingHttpResponse
#from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from uuid import uuid4
import os
import json
import fitz
import shutil
import time

@csrf_exempt
def upload(request):
    if request.method == 'POST' and request.FILES['file']:
        file = request.FILES['file']
        file_id = str(uuid4())
        print(file_id)
        file_content = file.read()
        with open(f'uploads/{file_id}.pdf', 'wb') as f:
            f.write(file_content)
        return JsonResponse({'success': True, 'id': file_id})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method or missing file'})
    
@csrf_exempt
def highlight(request, id):
    if request.method == 'POST' or request.method == 'PUT':
        body = json.loads(request.body)
        data = body['data']
        shutil.copy(f'uploads/{id}.pdf', f'uploads/{id}_original.pdf')
        #print(data)
        file_path = os.path.join(f'uploads/{id}_original.pdf')
        if os.path.exists(file_path):
            doc = fitz.open(file_path)
            for note in data:
                highlightAreas = note['highlightAreas']
                content = note['content']

                rects = {}
                for highlightArea in highlightAreas:
                    pageIndex = highlightArea['pageIndex']
                    page = doc[pageIndex]
                    w, h = page.rect.width, page.rect.height
                    left = highlightArea['left']*w/100.0
                    top = highlightArea['top']*h/100.0
                    height = highlightArea['height']*h/100.0
                    width = highlightArea['width']*w/100.0
                    if height > 0 and width > 0:
                        if pageIndex not in rects:
                            rects[pageIndex] = []
                        rects[pageIndex].append(fitz.Rect(left,top,left + width,top+ height))
                
                for key in list(rects.keys()):
                    page = doc[key]
                    highlight = page.add_highlight_annot(rects[key])
                    highlight.set_info(fitz.PDF_ANNOT_IS_HIDDEN, content)
                    highlight.update()

            doc.save(f'uploads/{id}.pdf')
            doc.close()
            os.remove(f'uploads/{id}_original.pdf')
        
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'error': 'Invalid request method'})
    
@csrf_exempt
def check_modified_sse(request, id):
    file_path = os.path.join(f'uploads/{id}.pdf')
    def event_stream():
        modified_time = os.path.getmtime(file_path)
        # Logic to check if the PDF file has changed
        # If the file has changed, send a message to the client
        # Otherwise, sleep for a few seconds and check again

        while True:
            # Check if the PDF file has changed
            # If it has changed, send an SSE message to the client
            tmp = os.path.getmtime(file_path)
            if modified_time != tmp:
                modified_time = tmp
                yield f"data: {modified_time}\n\n"

            # Sleep for a few seconds before checking again
            time.sleep(1)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response

def view(request, id):
    file_path = os.path.join(f'uploads/{id}.pdf')
    print(file_path)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='application/pdf')
    else:
        return HttpResponseNotFound()