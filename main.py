import webapp2,sys,logging,urllib
from google.appengine.api import users
import database, app_file

# debug, info, warning, error, critical
logging.getLogger().setLevel(logging.INFO)
sys.path.insert(0, 'lib')

def clean_path(raw_request):
	'''turn the literal http request in to a decoded string'''

	path = raw_request.strip('/')
	path = urllib.unquote(path.encode('ascii')).decode('utf-8')
	return path if path else "index"

def removeCMSElements(html):
	'''given an html string, remove all the stuff inserted by the CMS'''

	from bs4 import BeautifulSoup

	# remove administrative stuff
	soup = BeautifulSoup(html,'html.parser')
	for div in soup.find_all('div', {'class':'adminutility'}): 
		div.decompose()

	# remove templated elements
	for div in soup.find_all('div', {'class':'template'}): 
		div.decompose()

	# remove all contenteditable properties
	for tag in soup(): 
		del tag['contenteditable'] 

	# remove all ckeditor classes - also done client-side
	for div in soup.findAll("div", {"class" : lambda L: L and L.startswith('cke_')}):
		div.decompose()

	return soup.prettify()

class Server(webapp2.RequestHandler):

	def new_if_new(self,path):
		'''
		If an administrative client is creating a new page, return a
		database object for a new page with the template set as specified
		'''
		if users.is_current_user_admin() \
		and self.request.get('template') \
		and path == 'new':
			new_page_instance = database.Page.findby_path(path)
			new_page_instance.template = self.request.get('template')
			return new_page_instance

	def get(self):
		'''
		Handle HTTP GETs
		Try to lookup the path in the database and write out the content
		'''

		self.response.headers['Content-Type'] = 'text/html'

		path = clean_path(self.request.path)
		db_entry = database.Page.findby_path(path) \
		or self.new_if_new(path) \
		or database.Page.findby_path('404')

		# set HTTP 404 if appropriate
		try:
			assert db_entry.title != '404'
		except AssertionError:
			self.response.set_status(404)

		try:
			# pull the template content specified in the database
			template_contents = app_file.get(
				'templates/{}.html'.format(db_entry.template)
			)
		except AttributeError as e:
			'''Failed querying db_entry.template because the property does not
			exist - maybe db_entry is None type or something else wrong'''
			logging.error(
				'Database entry for "{}" missing or has no .template'.format(path)
			)
			raise e
		except IOError as e:
			'''Failed pulling from from disk - requested template file does
			not exist'''
			logging.error(
				'Requested template file "{}" does not exist'.format(path)
			)
			raise e
				
		# full out the template from the database
		public_content = template_contents.format(
			title = db_entry.title,
			body = db_entry.html
		)

		self.response.write(public_content)

		if users.is_current_user_admin():
			#current_user = users.get_current_user()
			#nickname = current_user.email()
			#nickname = nickname.split('@')[0] # user, no domain
			# set the admin bar mode
			if db_entry.template == 'gallery':
				mode = 'gallery'
			else:
				mode = 'standard'
			admin_bar = app_file.get('templates/admin_bar.html')
			# append the admin bar
			admin_bar = admin_bar.format(mode = mode)
			self.response.write(admin_bar)

	def post(self):
		'''
		Handle HTTP POSTs
		Web content is scraped by client-side script and the content is
		saved verbatim to the same path
		'''

		path = clean_path(self.request.path)
		intent = self.request.get('_intent')

		if not users.is_current_user_admin():
			# just serve the content like normal
			self.get()

		elif intent == 'set' and users.is_current_user_admin(): 

			from cgi import escape

			scraped_content = self.request.get('content', default_value = '')
			public_content = removeCMSElements(scraped_content)

			db_entry = database.Page.findby_path(path)

			if not db_entry:
				# page does not exist yet - create it with specified template
				db_entry = database.Page(
					path = path,
					template = self.request.get('template')
				)
			
			'''escape the title for general sanity, but don't escape the body -
			all editors are trusted admins and should be allowed to add script
			or other elements if they wish'''
			db_entry.title = escape(
				self.request.get('title', default_value = '')
			)
			db_entry.html = public_content
			db_entry.put()

			self.redirect('/{}'.format(path))

		elif intent == 'delete' and users.is_current_user_admin():

			db_entry = database.Page.findby_path(path)
			db_entry.key.delete()

			# redirect is done client side
	
application = webapp2.WSGIApplication([(r'/.*', Server),], debug=False)