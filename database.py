import urllib

from google.appengine.ext import ndb

class Page(ndb.Model):

    path = ndb.StringProperty()
    template = ndb.StringProperty()
    html = ndb.TextProperty()

    @classmethod
    def findby_path(cls, path):
        return cls.query(Page.path==path).get()