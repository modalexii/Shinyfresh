def make_html(raw_listing):

	html_listing = ""

	files = {}

	for i in raw_listing:
		i = i.filename.replace("/dres/","")
		i = i.split("/")
		f = i[-1]
		d = "".join(i[:-1])
		try:
			files[d].append(f)
		except KeyError:
			files[d] = [f]

	for d in sorted(files.keys()):
		for f in files[d]:
			print "D: " + d
			print "F: " + f
			if d:
				uri = "{d}/{f}".format(**locals())
			else:
				uri = f
			html_listing += '''<tr><td><a href="/dres/{uri}" target="_blank">/dres/{uri}</a></td></tr>'''.format(**locals())



	import templates
	return templates.get("gcs_directory").format(**locals())




