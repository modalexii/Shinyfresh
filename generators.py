
def http_to_gcs_path(raw_request, bucket):
    '''
    Given the http request path, return the equivalent path to the object
    in GCS. This is a string formatter only - it does not care if the path
    actually exists in GCS.
    '''
    import urllib 

    request = raw_request.lstrip('/files/')
    request = urllib.unquote(request.encode('ascii')).decode('utf-8')
    absolute_path = '/{b}/{r}'.format(
        b = bucket,
        r = request
    ) 
    
    return absolute_path if request else '__index'

def gcs_to_http_path(gcs_abs_path, bucket):
    '''
    Given the GCS absolute (bucket + file) path, return the equivalent HTTP
    path. This is a string formatter only - it does not care if the path 
    actually exists in GCS.
    '''
    import urllib 

    request = gcs_abs_path.lstrip('/{}/'.format(bucket))
    request = urllib.quote(request)
    absolute_path = '/files/{}'.format(request) 
    
    return absolute_path

def admin_file_index(gcs_bucket):
    '''
    Generate links and thumbnails (where applicable) for the admin bar file
    browser. Returns HTML.
    '''
    from google.appengine.api import images
    import cloudstorage as gcs
    import app_file

    gcs_bucket = '/{}'.format(gcs_bucket)
    thumbs = text_links = ''

    for stat in gcs.listbucket(gcs_bucket, delimiter = '/'):
        # does not currently account for pseudo-subdirectories (stat.is_dir)

        gcs_abs_path = stat.filename
        gcs_handoff_uri = '/gs{}'.format(gcs_abs_path)
        filename = gcs_abs_path.split('/')[-1]
        mime = gcs.stat(gcs_abs_path).content_type

        if mime.split('/')[0] == "image":
            # get a public url for the thumbnail
            src_thumb = images.get_serving_url(
                None, 
                filename = gcs_handoff_uri,
                size = 400,
                crop = True
            )
            # get a public url for the full image
            src_full = images.get_serving_url(
                None, 
                filename = gcs_handoff_uri,
            )
            template = app_file.get('templates/file_browser_thumb.html')
            index_entry = template.format(
                raw_url = src_full,
                thumb_url = src_thumb,
                filename = filename
            )
            # append to running blob
            thumbs = '{thumbs}{index_entry}'.format(
                thumbs = thumbs, 
                index_entry = index_entry
            )

        else:
            http_path = gcs_to_http_path(gcs_abs_path, gcs_bucket)
            template = app_file.get('templates/file_browser_nothumb.html')
            index_entry = template.format(
                url = http_path,
                filename = filename
            )
            # append to running blob
            text_links = '{text_links}{index_entry}'.format(
                text_links = text_links, 
                index_entry = index_entry
            )

    # drop index in to the file manager gallery template
    template = app_file.get('templates/gallery_filemanager.html')
    html = template.format(
        thumbs = thumbs,
        text_links = text_links
    )

    return html
        