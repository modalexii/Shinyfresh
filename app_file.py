def get(path):
	'''
	Return flie contents given path from /static/
	'''

	with open("{path}".format(**locals()),"r") as f:
		return f.read()
