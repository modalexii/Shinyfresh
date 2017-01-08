import webapp2
import cloudstorage

class FetchHandler(webapp2.RequestHandler):

	def get_listing(self):
		'''
		Return HTML listing of GCS files.
		'''
		import pretty_listing
		self.response.headers['Content-Type'] = 'text/html'

		listing = cloudstorage.listbucket("/dres/")

		self.response.write(
			pretty_listing.make_html(listing)
		)


	def get(self, *args, **kwargs):
		from urllib import unquote

		uri = self.request.path
		uri = unquote(uri.encode('ascii')).decode('utf-8')

		try:
			gcs_object = cloudstorage.open(
				uri,
				mode = "r",
			)
		except cloudstorage.NotFoundError:
			if uri == "/dres/directory":
				self.get_listing()
				return # awk :-/
			else:
				self.response.set_status(404)
		else:
			gcs_object_info = cloudstorage.stat(
				uri,
			)

			self.response.headers['Content-Type'] = gcs_object_info.content_type
			self.response.write(gcs_object.read())

			gcs_object.close()

application = webapp2.WSGIApplication([
	('/dres/.*', FetchHandler)
], debug=False)

