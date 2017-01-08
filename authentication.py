import webapp2
from google.appengine.api import users

class Login(webapp2.RequestHandler):

	def get(self):
		
		login_url = users.create_login_url(dest_url = "/")
		self.redirect(login_url)

class Logout(webapp2.RequestHandler):

    def get(self):

        logout_url = users.create_logout_url(
            dest_url = referer if referer else "/"
        )
        self.redirect(logout_url)

application = webapp2.WSGIApplication([
	(r'/login', Login),
    (r'/logout', Logout),
], debug=False)