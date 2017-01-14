# Copyright 2012 Google Inc. All Rights Reserved.

#[START sample]
"""A sample app that uses GCS client to operate on bucket and file."""

#[START imports]
import logging
import os
import cloudstorage as gcs
import webapp2

from google.appengine.api import app_identity
#[END imports]

#[START retries]
my_default_retry_params = gcs.RetryParams(initial_delay=0.2,
                                          max_delay=5.0,
                                          backoff_factor=2,
                                          max_retry_period=15)
gcs.set_default_retry_params(my_default_retry_params)
#[END retries]


class MainPage(webapp2.RequestHandler):
  """Main page for GCS demo application."""


  def get(self):

    bucket_name = os.environ.get(
        'BUCKET_NAME',
        app_identity.get_default_gcs_bucket_name()
    )

    bucket = '/' + bucket_name
    '''
    try:
      self.create_file(filename)
      self.response.write('\n\n')

      self.read_file(filename)
      self.response.write('\n\n')

      self.stat_file(filename)
      self.response.write('\n\n')

      self.create_files_for_list_bucket(bucket)
      self.response.write('\n\n')

      self.list_bucket(bucket)
      self.response.write('\n\n')

      self.list_bucket_directory_mode(bucket)
      self.response.write('\n\n')

    except Exception, e:
      logging.exception(e)
      self.delete_files()
      self.response.write('\n\nThere was an error running the demo! '
                          'Please check the logs for more details.\n')

    else:
      self.delete_files()
      self.response.write('\n\nThe demo ran successfully!\n')
    '''
    def post(self):

        



#[START write]
    def create_file(self, name, mime, blob):
        gcs_file = gcs.open(name, 'w', content_type = mime)
        gcs_file.write(blob)
        gcs_file.close()
#[END write]

#[START read]
    def read_file(self, filename):
        gcs_file = gcs.open(filename)
        self.response.write(gcs_file.read())
        gcs_file.close()
#[END read]

    def stat_file(self, filename):
        self.response.write('File stat:\n')

        stat = gcs.stat(filename)
        self.response.write(repr(stat))


    def list_bucket_directory_mode(self, bucket):
        self.response.write('Listbucket directory mode result:\n')
        for stat in gcs.listbucket(bucket + '/b', delimiter='/'):
            self.response.write('%r' % stat)
            self.response.write('\n')
            if stat.is_dir:
                for subdir_file in gcs.listbucket(stat.filename, delimiter='/'):
                self.response.write('  %r' % subdir_file)
                self.response.write('\n')

#[START delete_files]
    def delete_files(self, filename):
        try:
            gcs.delete(filename)
        except gcs.NotFoundError:
            pass
#[END delete_files]


application = webapp2.WSGIApplication([('/user/', MainPage)],
                              debug=True)
#[END sample]