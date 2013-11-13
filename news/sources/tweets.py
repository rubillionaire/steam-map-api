import logging
from django.conf import settings

from twython import Twython

from .tweet import Tweet

logger = logging.getLogger(__name__)


class Tweets():
    """
    Manages Tweet class instances.
    """
    def __init__(self):
        # arrays of tweets classes
        self.tweets = []

        # Boolean that tracks if the calls
        # to the server were successful.
        self.successful_connection = False

        # arrays of tids represented
        # in this object
        self.tids = []

        # twitter connection
        self.api = Twython(
            settings.NEWS_TWITTER_CONSUMER_KEY,
            settings.NEWS_TWITTER_CONSUMER_SECRET,
            settings.NEWS_TWITTER_ACCESS_TOKEN,
            settings.NEWS_TWITTER_ACCESS_TOKEN_SECRET)

        # raw twitter response
        self.raw = self.get_tweets()

        # add all posts to this manager
        for tweet in self.raw:
            self.add(Tweet(tweet))

    def get_tweets(self):
        """
        will get all of the toots to deal with
        """
        tweets = []
        try:
            self.timeline = self.api.get_user_timeline(screen_name='risd_mg',
                                                       count=200,
                                                       include_rts=True,
                                                       exclude_replies=True)
            self.favorites = self.api.get_favorites(screen_name='risd_mg',
                                                    count=200)

            if len(self.timeline) > 0 and len(self.favorites) > 0:

                tweets = self.timeline + self.favorites
                self.successful_connection = True

            else:
                self.successful_connection = False
        except:
            self.successful_connection = False
            logging.info("Problems getting tweets from Twitter API.")

        return tweets

    def add(self, tweet):
        """
        add a Tweet instance to be tracked
        for updates, to to be created
        """
        self.tids.append(tweet.tid)
        self.tweets.append(tweet)

        return self

    def compare(self, steam_model):
        """
        steam_model is a Tweet model instance

        if update needs to occur, do so
        from the steam_model instance

        return self
        """
        tweet = None

        # set `tweet` to the Tweet class
        # of data that twitter sent us
        # to compare against steam_model
        for t in self.tweets:
            if steam_model.tid == t.tid:
                tweet = t
                break

        # compare the twitter data to steam data
        if tweet:
            # we now have evidence that this
            # thing exists in some form in the
            # database, and does not need to
            # be created.
            tweet.exists_in_database = True

            need_to_save = False

            if steam_model.user != tweet.user:
                need_to_save = True
                steam_model.user = tweet.user

            if steam_model.screen_name != tweet.screen_name:
                need_to_save = True
                steam_model.screen_name = tweet.screen_name

            if steam_model.text != tweet.text:
                need_to_save = True
                steam_model.text = tweet.text

            if steam_model.html != tweet.html:
                need_to_save = True
                steam_model.html = tweet.html

            if steam_model.epoch_timestamp != tweet.epoch_timestamp:
                need_to_save = True
                steam_model.epoch_timestamp = tweet.epoch_timestamp

            if steam_model.timestamp != tweet.timestamp:
                need_to_save = True
                steam_model.timestamp = tweet.timestamp

            if steam_model.url != tweet.url:
                need_to_save = True
                steam_model.url = tweet.url

            # save it out if anything changed
            if need_to_save:
                steam_model.save()

        return self

    def to_create(self):
        """
        looks for Tweet objects that have
        a False ['exists_in_database'] value

        returns a list of tweets that
        need to be created in the database.
        """
        tweets_to_create = []

        for tweet in self.tweets:
            if not tweet.exists_in_database:
                tweets_to_create.append(tweet)

        return tweets_to_create
