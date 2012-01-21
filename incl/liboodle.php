<?php

class oodle {

	private $_key;
	private $_data=array();
	private $_url='http://api.oodle.com/api/v2/listings';

	public function __construct($key=null) {
		$this->_key=$key;
		$this->_data['key']=$key;
		$this->_data['region']='usa';
		$this->_data['format']='php_serial';
	}

	public function search($location=null,$category=null) {
		if($location) $this->location=$location;
		if($category) $this->category=$category;
		$h=new http($this->_url);
		foreach($this->_data as $k=>$v) {
			$h->add_get($k,$v);
		}
		$out=$h->execute();
		if($this->format=='php_serial') $out=unserialize($out);
		return $out;
	}

	public function __set($key,$value) {
		$this->_data[$key]=$value;
	}

	public function __get($key) {
		return (isset($this->_data[$key])) ? $this->_data[$key]:null;
	}

}
?>
