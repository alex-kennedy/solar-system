import luigi
import datetime
from get_small_bodies import *

class DownloadLatest(luigi.Task):
    date = luigi.DateParameter(default=datetime.date.today())

    def run(self):
        download_latest()

    def output(self):
        return luigi.LocalTarget(SAVE_FILE + ".dat")


class GcloudDownloadPrevious(luigi.Task):
    date = luigi.DateParameter(default=datetime.date.today())

    def requires(self):
        return DownloadLatest(self.date)

    def run(self):
        gcloud_download_previous()

    def output(self):
        return luigi.LocalTarget(SAVE_FILE + "_previous.csv")


class ProcessSmallBodies(luigi.Task):
    date = luigi.DateParameter(default=datetime.date.today())

    def requires(self):
        return DownloadLatest(self.date)

    def run(self):
        process_small_bodies()

    def output(self):
        return luigi.LocalTarget(SAVE_FILE + ".csv")


class CheckForChanges(luigi.Task):
    date = luigi.DateParameter(default=datetime.date.today())

    def requires(self):
        return ProcessSmallBodies(self.date)

    def run(self):
        check_for_changes()

    def output(self):
        return luigi.LocalTarget("deletions.csv"), luigi.LocalTarget("overwrites.csv")


class GcloudUpdateDatastore(luigi.Task):
    date = luigi.DateParameter(default=datetime.date.today())

    def requires(self):
        return CheckForChanges(self.date)

    def run(self):
        gcloud_update_datastore()

    def output(self):
        return luigi.LocalTarget("luigi_workflow.py")
