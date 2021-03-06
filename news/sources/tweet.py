# -*- coding: utf-8 -*-

import logging
from datetime import datetime
import pytz

from pyquery import PyQuery as pq

from .common import CommonHTML

logger = logging.getLogger(__name__)
common = CommonHTML()


class Tweet():
    """Wrapper around Tweet models"""
    def __init__(self, toot):
        # raw response data from Twitter
        self.raw = toot

        # variables to be initialized
        # based on the Twitter response
        self.tid = None
        self.user = None
        self.screen_name = None
        self.html = None
        self.timestamp = None
        self.epoch_timestamp = None
        self.url = None
        self.text = None

        # tracks status of the object
        # being in the database or not
        self.exists_in_database = False

        # kick it all off
        self.setup()

    def _wrap_links_in_a(self):
        linked_toot = self.text

        # wrap the urls in a tags
        for url in self.raw[u'entities'][u'urls']:
            wrapped_url = pq('<a></a>')\
                .attr('href', url[u'url'])\
                .text(url[u'url'])
            linked_toot = linked_toot.replace(url[u'url'], unicode(wrapped_url))

        # wrap the hashtags in a tags
        for hashtag in self.raw[u'entities'][u'hashtags']:
            link = 'https://twitter.com/search?q=%23' +\
                '{0}'.format(hashtag[u'text']) +\
                '&src=hash'

            wrapped_hastag = pq('<a></a>')\
                .attr('href', link)\
                .text(u'#' + hashtag[u'text'])

            linked_toot = linked_toot.replace(u'#' + hashtag[u'text'],
                                              unicode(wrapped_hastag))

        for user in self.raw[u'entities'][u'user_mentions']:
            link = 'https://twitter.com/{0}'.format(user[u'screen_name'])

            wrapped_user = pq('<a></a>')\
                .attr('href', link)\
                .text(u'@' + user[u'screen_name'])

            linked_toot = linked_toot.replace(u'@' + user[u'screen_name'],
                                              unicode(wrapped_user))

        return linked_toot

    def _create_html(self):
        """ take in self, set html, return self """

        tweet_section = pq('<section></section>')\
            .attr('class', 'content tweet')

        grid = pq('<div></div>')\
            .attr('class', 'grid full-width clearfix')

        post_date_ul = common.post_date(self.timestamp)

        post_wrapper = pq('<div></div>')\
            .attr('class', 'post clearfix three-column')

        post_filter = common.filter('tweet')

        tweet = pq('<h3></h3>')\
            .html(self._wrap_links_in_a())

        user_info = pq('<p></p>')\
            .attr('class', 'single-tweet')\
            .html('{0} <span>{1}</span>'.format(self.user,
                                                self.screen_name))
        share = common.share()

        post_wrapper\
            .append(post_filter)\
            .append(tweet)\
            .append(user_info)\
            .append(share)

        grid.append(post_date_ul)\
            .append(post_wrapper)

        s = pq(tweet_section)
        s.append(grid)

        self.html = unicode(s.html())

        return self

    def _create_timestamp(self):
        self.timestamp = datetime\
            .strptime(self.raw['created_at'],
                      '%a %b %d %H:%M:%S +0000 %Y')\
            .replace(tzinfo=pytz.utc)

        return self

    def _create_epoch_timestamp(self):
        self.epoch_timestamp = int(self.timestamp.strftime('%s'))
        return self

    def _create_url(self):
        # https://twitter.com/<user>/status/<id>
        self.url = 'https://twitter.com/' +\
                   '{0}/'.format(self.screen_name) +\
                   'status/' +\
                   '{0}'.format(self.tid)

        return self

    def setup(self):
        self.tid = self.raw['id_str']
        self.text = self.raw['text']
        self.user = self.raw['user']['screen_name']
        self.screen_name = self.raw['user']['screen_name']

        self._create_url()\
            ._create_timestamp()\
            ._create_epoch_timestamp()\
            ._create_html()

        return self

    def data(self):
        return {
            'tid': self.tid,
            'user': self.user,
            'screen_name': self.screen_name,
            'html': self.html,
            'timestamp': self.timestamp,
            'epoch_timestamp': self.epoch_timestamp,
            'url': self.url,
            'text': self.text,
        }
