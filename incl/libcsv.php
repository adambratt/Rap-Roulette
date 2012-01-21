<?php

class csv {

	private $data;
	private $filename;

	public function __construct($data=null,$filename=null) {
		if($filename!==null) $this->filename=$filename;
		if(is_array($data)) {
			$this->load($data);
			$this->download();
		}
	}

	public function load($data) {
		$this->data=$data;
	}

	public function set_filename($filename) {
		$this->filename=$filename;
	}

	private function get_filename() {
		if($this->filename===null) $this->filename='data.csv';
		if(substr($this->filename,-4)!='.csv') $this->filename.='.csv';
		return $this->filename;
	}

	/**
	 * Create the csv and offer it up for download.
	 * Exits after the function is called
	 */

	public function download() {
		if(!is_array($this->data)) return;
		$temp = tmpfile();
		fputcsv($temp,array_keys($this->data[0]));
		foreach($this->data as $a) {
			fputcsv($temp,$a);
		}
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="'.$this->get_filename().'"');
		rewind($temp);
		fpassthru($temp);

		fclose($temp);
		exit;
	}

}
?>
