import webapp2,logging,os,urllib
from google.appengine.api import users, app_identity
import cloudstorage as gcs
import generators

my_default_retry_params = gcs.RetryParams(
    initial_delay=0.2,
    max_delay=5.0,
    backoff_factor=2,
    max_retry_period=15
)
gcs.set_default_retry_params(my_default_retry_params)

default_bucket = os.environ.get(
    'BUCKET_NAME',
    app_identity.get_default_gcs_bucket_name()
)


class GCSInterface(webapp2.RequestHandler):

    def get(self):
        '''
        Handle HTTP GETs - serve blobs or an index
        '''

        gcs_abs_path = generators.http_to_gcs_path(
            self.request.path,
            default_bucket
        )

        try:
            self.serve_file(gcs_abs_path)
        except AttributeError:
            self.response.set_status('404')
        except ValueError:
            # depends on no blob being named 'index'
            self.serve_admin_file_index()
        
    def post(self):
        '''
        Handle HTTP POSTs - upload or delete blobs
        '''

        path = self.request.path

        if path == '/files/upload' and users.is_current_user_admin():

            try:
                name = self.request.POST.get('file').filename
                mime = self.request.POST.get('file').type 
                blob = self.request.POST.get('file').file.read()
            except AttributeError:
                self.response.set_status('400')
            else:
                gcs_abs_path = generators.http_to_gcs_path(
                    name, 
                    default_bucket
                )
                self.create_file(gcs_abs_path, mime, blob)

        elif path == '/files/delete' and users.is_current_user_admin():

            gcs_abs_path = generators.http_to_gcs_path(
                # another layer of not accounting for pseudo-directories
                self.request.get('filename'), 
                default_bucket
            )
            self.delete_files(gcs_abs_path)

    def create_file(self, gcs_abs_path, mime, blob):
        '''
        Write a new GCS blob
        '''
        gcs_file = gcs.open(gcs_abs_path, 'w', content_type = mime)
        gcs_file.write(blob)
        gcs_file.close()

    def serve_file(self, gcs_abs_path):
        '''
        Write a file out to the client. Sends HTTP, returns nothing.
        '''
        mime = gcs.stat(gcs_abs_path).content_type
        self.response.headers['Content-Type'] = mime
        gcs_file = gcs.open(gcs_abs_path)
        self.response.write(gcs_file.read())
        gcs_file.close()

    def serve_html_index(self, bucket = default_bucket):
        '''
        Write out a (barely) HTML text index. Sends HTTP, returns nothing. 
        Not in use.
        '''
        bucket = '/{}'.format(bucket)
        for stat in gcs.listbucket(bucket, delimiter = '/'):
            gcs_abs_path = stat.filename
            http_path = gcs_abs_path.replace(bucket, '/files')
            self.response.write(http_path)
            self.response.write('<br>')

    def serve_admin_file_index(self, bucket = default_bucket):
        '''
        Write out the admin bar file index. Sends HTTP, returns nothing.
        '''
        html = generators.admin_file_index(bucket)
        self.response.write(html)

    def delete_files(self, gcs_abs_path):
        '''
        Delete a blob from GCS 
        '''
        from google.appengine.api import images

        try:
            gcs.delete(gcs_abs_path)
        except gcs.NotFoundError:
            pass
        '''
        per docs we should also destroy the serving url, but how to
        obtain the blobkey is unclear, possibly not necessary? seems
        to work for now, but leaves a bunch of orphaned entries
        images.delete_serving_url(
            gcs.stat(gcs_abs_path).etag
        )
        '''
        
application = webapp2.WSGIApplication(
    [('/files/.*', GCSInterface)],
    debug=False
)
