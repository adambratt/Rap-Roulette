<?php

class video extends file_object {

	private $width = '320';
	private $height = '240';
	private $storage_type='flv';
	private $type;
	private $types=array();
	private $video_dir = 'videos/';
	private $converted_dir = 'converted/';
	private $upload_dir='uploaded/';
	private $sizes=array();
	private $size;

	public function __construct($filename=null, $upload=false) {
		parent::__construct();
		$this->types=array('mpeg'=>'video/mpeg','mp2'=>'video/mpeg','mpa'=>'video/mpeg','mpe'=>'video/mpeg','mpg'=>'video/mpeg','mpv2'=>'video/mpeg','mov'=>'video/quicktime','qt'=>'video/quicktime','3gp'=>'video/3gp','avi'=>'video/avi','avi'=>'x-msvideo','asf'=>'video/x-ms-asf','flv'=>'video/x-flv','gvi'=>'application/x-gsp','flv'=>'applicationg/x-gsp','movie'=>'video/x-sgi-movie','mp4'=>'video/mp4','ogg'=>'application/ogg','swf'=>'application/x-shockwave-flash','vgm'=>'video/x-videogram','wm'=>'video/x-ms-wm','wmv'=>'video/x-ms-wmv','wvx'=>'video/x-ms-wvx','avi'=>'video/x-divx','avi'=>'video/x-divx','avi'=>'video/x-h263','divx'=>'video/x-divx','avi'=>'video/mpeg',);
		if($upload) $this->upload($filename);
	}
	
	public function get_video_state($filename){
		if(is_file($this->video_dir.$this->upload_dir))	return "upload";
		if(is_file($this->video_dir.$this->converted_dir)) return "convert";
		return 0;
	}
	
	public function upload($filename) {
		if(!is_dir($this->video_dir)) mkdir($this->video_dir);
		if(!is_dir($this->get_upload_path())) mkdir($this->get_upload_path());
		$name=$this->gen_filename();
		$out=$filename;
		$out.=$this->get_upload_path();
		file_put_contents(CWD.'log.txt',$out);
		move_uploaded_file($filename,$this->get_upload_path().$name);
		$this->load_video($name);
		$this->convert();
	}
	
	static public function handle_upload() {
		if(!count($_FILES)) return;
		$out=array();
		foreach($_FILES as $k=>$v) {
			if(is_array($v['error'])) {
				foreach($v['error'] as $key=>$error) {
					if($error==UPLOAD_ERR_OK) {
						$tmp_name = $_FILES[$k]["tmp_name"][$key];
						$video = new video($tmp_name,true);
						$out[]=$video->get_filename();
					}
				}
			}
		}
		return $out;
	}

	private function convert() {
		$cmd='/usr/bin/ffmpeg -i '.$this->get_upload_path().$this->get_filename().' -ar 22050 -ab 56 -t 90 -aspect 4:3 -qscale 4 -r 12 -f flv -s 420x314 -acodec mp3 -ac 1 '.$this->get_convert_path().$this->get_filename().'.flv &> /dev/null &';
		`$cmd`;
	}

	public function get_filename() {
		return $this->filename;
	}
	
	public function load_video($filename){
		$this->filename = $filename;
	}
	
	public function get_upload_path(){
		return $this->video_dir.$this->upload_dir;
	}
	
	public function get_convert_path(){
		return $this->video_dir.$this->converted_dir;
	}
}
?>
