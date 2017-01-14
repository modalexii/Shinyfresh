from google.appengine.ext import ndb

class Page(ndb.Model):

    path = ndb.StringProperty(required=True)
    title = ndb.StringProperty()
    html = ndb.TextProperty()
    template = ndb.StringProperty(required=True)

    @classmethod
    def findby_path(cls, path):
        return cls.query(Page.path==path).get()

'''
To put new entries in the DB via the interactive console:
from google.appengine.ext import ndb
class Page(ndb.Model):
  path = ndb.StringProperty()
  title = ndb.TextProperty()
  template = ndb.StringProperty()
  html = ndb.TextProperty()
e = Page(path="new", template="child", html="
<p>
A blank spate appears...
</p>
")
e.put()
'''