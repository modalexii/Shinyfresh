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

		try:
			# pull the template content specified in the database
			template_contents = app_file.get(
				'templates/{}.html'.format(db_entry.template)
			)
		except AttributeError as e:
			'''Failed querying db_entry.template because the property does not
			exist - maybe db_entry is None type or something else wrong'''
			logging.error(
				'Database entry for "{}" has no .template'.format(path)
			)
			raise e
		except IOError as e:
			'''Failed pulling from from disk - requested template file does
			not exist'''
			logging.error(
				'Requested template file "{}" does not exist'.format(path)
			)
			raise e
				
				

		# pull the html content...
		meat = db_entry.html

		public_content = template_contents.format(body = meat)
		self.response.write(public_content)

		if users.is_current_user_admin():
			current_user = users.get_current_user()
			nickname = current_user.email()
			nickname = nickname.split('@')[0] # user, no domain
			# append the admin bar
			admin_bar = app_file.get('templates/admin_bar.html')
			admin_bar = admin_bar.format(nickname = nickname)
			self.response.write(admin_bar)

	def post(self):
		'''
		Handle HTTP POSTs
		Web content is scraped by client-side script and the content is
		saved verbatim to the same path
		'''

		from bs4 import BeautifulSoup

		path = clean_path(self.request.path)
		intent = self.request.get('_intent')

		if not users.is_current_user_admin():
			# just serve the content like normal
			self.get()

		elif intent == 'set' and users.is_current_user_admin(): 

			scraped_content = self.request.get('content')

			# remove administrative stuff from web content
			soup = BeautifulSoup(scraped_content,"html.parser")
			for div in soup.find_all('div', {'class':'adminutility'}): 
				div.decompose()

			public_content = soup.prettify()

			db_entry = database.Page.findby_path(path)

			if not db_entry:
				# page does not exist yet - create it with specified template
				db_entry = database.Page(
					path = path,
					template = self.request.get('template')
				)
				
			db_entry.html = public_content
			db_entry.put()

			self.redirect('/{}'.format(path))

		elif intent == 'delete' and users.is_current_user_admin():

			db_entry = database.Page.findby_path(path)
			db_entry.delete()

			# redirect is done client side, no need to do it here
	


application = webapp2.WSGIApplication([(r'/.*', Server),], debug=False)