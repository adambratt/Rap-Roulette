<?php

class video extends rfile {

	protected $_upload_path;
	protected $_convert_path;
	protected $bin;

	public function __construct($id=null) {
		parent::__construct($id);
		$this->uploadpath=$this->spath.'video_upload/';
		if(!is_dir($this->uploadpath)) mkdir($this->uploadpath);
		//$this->bin=CWD.'/incl/ffmpeg.exe';
		$this->bin='/usr/bin/ffmpeg';
	}

	public function is_loaded() {
		if(!parent::is_loaded()) return false;
		return $this->converted;
	}

	static public function upload($key,$class=null) {
		$rf=parent::upload($key,'video');
		if($rf==null) return null;
		$rf->convert();
		return $rf;
	}

	public function convert() {
		$cmd='"'.$this->bin.'" -i "'.$this->uploadpath.$this->filename.'" -ar 22050 -vhook "/usr/lib/vhook/watermark.so -f ./files/images/full/wm.gif" -ab 56 -t 90 -aspect 4:3 -qscale 4 -r 12 -f flv -s 420x314 -acodec mp3 -ac 1 "'.$this->spath.$this->filename.'.cnvt.flv" &> /dev/null && mv "'.$this->spath.$this->filename.'.cnvt.flv" "'.$this->spath.$this->filename.'.flv" &';
		//file_put_contents('./files/cmd.bat',$cmd);
		//$cmd='./files/cmd.bat';
		`$cmd`;
	}

	public function get_thumbnail() {
		if(!$this->converted) return false;
		$tmp=tempnam('./files','bthm');
		$cmd=$this->bin.' -i '.$this->spath.$this->filename.' -r 1 -s 600x600 -f image2 -ss 1 '.$tmp.' &> /dev/null';
		`$cmd`;
		$i=new image($tmp,true);
		$this->image=$i->get_filename();
		unlink($tmp);
	}
	
	public function play() {
		header('Content-Type: video/x-flv');
		header('Content-Length: '.filesize($this->spath.$this->filename));
		readfile($this->spath.$this->filename);
		exit;
	}

	public function __get($key) {
		switch($key) {
			case 'image':
			if(!empty($this->data[$key])) break;
			$this->get_thumbnail();
			if(empty($this->data[$key])) return 'noimage';
			break;

			case 'converted':
			if(file_exists($this->spath.$this->filename)) return true;
			if(file_exists($this->spath.$this->filename.'.flv')) {
				rename($this->spath.$this->filename.'.flv',$this->spath.$this->filename);
				$this->get_thumbnail();
				return true;
			}
			return false;
		}

		return parent::__get($key);
	}
}
?>
