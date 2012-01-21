<?php

class image extends file_object {

	private $width;
	private $height;
	private $storage_type='png';
	private $output_type='png';
	private $type;
	private $types=array();
	private $img_dir='images';
	private $sizes=array();
	private $size;

	public function __construct($filename=null,$import=false,$upload=false) {
		parent::__construct();
		$this->type_path='images/';
		$this->types=array('png'=>'image/png','gif'=>'image/gif','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','bmp'=>'image/bmp');
		$this->set_sizes();

		if($import) {
			$this->import($filename,$upload);
		}elseif($filename!==NULL) {
			$this->load_image($filename);
		}
	}

	private function set_sizes() {
		if(!count($this->sizes)) {
			$csize=config::get_class_config('image');
			if(!count($csize)) {
				$this->sizes=array(
					'full'=>array('w'=>300,
								  'h'=>300),
					'small'=>array('w'=>100,
								   'h'=>100),
					'thumbnail'=>array('w'=>60,
									   'h'=>60));
			}else{
				$this->sizes=array();
				if(!isset($csize['size_full_w']) || !isset($csize['size_full_h'])) {
					$this->sizes['full']=array('w'=>640,'h'=>480);
				}
				if(!isset($csize['size_small_w']) || !isset($csize['size_small_h'])) {
					$this->sizes['small']=array('w'=>200,'h'=>200);
				}

				foreach($csize as $k=>$v) {
					if(substr($k,0,5)!='size_' || (substr($k,-2)!='_h' && substr($k,-2)!='_w') || strlen($k)<8) continue;
					$size=substr($k,5,strlen($k)-7);
					$wh=substr($k,-1);
					if($wh=='h') continue;
					if(!isset($csize['size_'.$size.'_h'])) {
						$h=(int)$v;
					}else{
						$h=(int)$csize['size_'.$size.'_h'];
					}

					$this->sizes[$size]=array('w'=>(int)$v,'h'=>$h);
				}
			}
		}
	}

	private function get_size_path($size,$full=false) {
		if(!isset($this->sizes[$size])) $size='small';
		if($size=='full') {
			$sp='full/';
		}else{
			$sp=$this->sizes[$size]['w'].'x'.$this->sizes[$size]['h'].$this->output_type.'/';
		}
		if($full) {
			return $this->get_type_path().$sp;
		}
		return $sp;
	}

	private function get_fullsize_image() {
		return new image($this->filename);
	}

	public function load_image($filename) {

		$info=pathinfo($filename);
		$this->filename=$info['filename'];

		if(isset($info['extension'])) {
			$ext=$info['extension'];
			if(isset($this->types[$ext])) $this->output_type=$ext;
		}

		if($info['dirname']=='.') {
			$size='full';
		}elseif(isset($this->sizes[$info['dirname']])) {
			$size=$info['dirname'];
		}else{
			$size='small';
		}

		$this->size=$size;

		$this->path=$this->get_size_path($size);

		if(!is_file($this->full_path())) {
			if(!is_file($this->fullsize_path())) {
				if(is_file($this->file_dir.$this->type_path.'full/noimage')) return $this->load_image('noimage');
				return false; // error
			}else{
				$this->resize($size);
			}
		}

		$details = getimagesize($this->full_path());
		$this->width=$details[0];
		$this->height=$details[1];
		$this->mime_type=$details['mime'];
		switch($details['mime']) {
			case 'image/jpeg':
			$this->type='jpg';
			break;
			case 'image/png':
			$this->type='png';
			break;
			case 'image/gif':
			$this->type='gif';
			break;
			case 'image/bmp':
			$this->type='bmp';
			break;
		}
	}

	public function import($filename,$upload=false) {
		//if(!file_get_contents($filename)) throw new Exception('File does not exists: '.$filename);
		if(!is_dir($this->get_type_path())) mkdir($this->get_type_path());
		if(!is_dir($this->get_type_path().'full')) mkdir($this->get_type_path().'full');
		$this->path='full/';
		$name=$this->gen_filename();
		if($upload) {
			move_uploaded_file($filename,$this->file_dir.$this->type_path.'full/'.$name);
		}else{
			copy($filename,$this->file_dir.$this->type_path.'full/'.$name);
		}
		$this->load_image($name);
		$this->resize('full');
	}
	
	static public function handle_url($post) {
		if(!is_array($post)){
			return false;	
		}
		foreach($post as $k=>$v){
			if($test = @file_get_contents($v)){
				$img = new image($v, true);
				$out[]=$img->get_filename();	
			}	
		}
		return isset($out) ? $out : false;
		
	}

	static public function handle_upload($ik=null) {
		if(!count($_FILES)) return array();
		$out=array();
		if($ik===null) {
			foreach($_FILES as $k=>$v) {
				if(is_array($v['error'])) {
					foreach($v['error'] as $key=>$error) {
						if($error==UPLOAD_ERR_OK) {
							$tmp_name = $_FILES[$k]["tmp_name"][$key];
							$img=new image($tmp_name,true,true);
							$out[]=$img->get_filename();
						}
					}
				}
			}
		}else{
			if(!isset($_FILES[$ik])) return array();
			$v=&$_FILES[$ik];
			if(is_array($v['error'])) {
				foreach($v['error'] as $key=>$error) {
					if($error==UPLOAD_ERR_OK) {
						$tmp_name = $_FILES[$ik]["tmp_name"][$key];
						$img=new image($tmp_name,true,true);
						$out[]=$img->get_filename();
					}
				}
			}else{
				if($v['error']==UPLOAD_ERR_OK) {
					$tmp_name=$_FILES[$ik]['tmp_name'];
					$img=new image($tmp_name,true,true);
					$out[]=$img->get_filename();
				}
			}
		}
		return $out;
	}

	public function is_loaded() {
		return $this->loaded;
	}

	public function get_filename() {
		return $this->filename;
	}

	public function resize($size) {
		if(!isset($this->sizes[$size])) $size='small';
		$maxwidth=$this->sizes[$size]['w'];
		$maxheight=$this->sizes[$size]['h'];
		$path=$this->fullsize_path();
		$details=getimagesize($path);
		$w=$details[0];
		$h=$details[1];
		$mime=$details['mime'];
		$this->size=$size;
		if(!is_dir($this->get_size_path($size,true))) mkdir($this->get_size_path($size,true));
		if($w <= $maxwidth && $h <= $maxheight) {
			if($size=='full') return;
			copy($this->fullsize_path(),$this->get_size_path($size,true).$this->get_filename());
			return;
		}

		$ratio_orig = $w/$h;

		if ($maxwidth/$maxheight > $ratio_orig) {
	            $maxwidth = $maxheight*$ratio_orig;
	        } else {
				$maxheight = $maxwidth/$ratio_orig;
	        }

	    // Resample
	    $image_p = imagecreatetruecolor($maxwidth, $maxheight);
		imagealphablending($image_p, false);
                        imagesavealpha($image_p, true);
		if($mime=='image/jpeg') {
			$image = imagecreatefromjpeg($this->fullsize_path());
	    }elseif($mime=='image/png') {
			$image=imagecreatefrompng($this->fullsize_path());
			imagealphablending($image, false);
			imagesavealpha($image, true);
		}elseif($mime=='image/gif') {
			$image=imagecreatefromgif($this->fullsize_path());
	    }else{
			return false; // XXX Alternate method for indexed images (gifs), do error checking initially for non-image files
		}
		imagecopyresampled($image_p, $image, 0, 0, 0, 0, $maxwidth, $maxheight, $w, $h);

		switch($this->output_type) {
			case 'gif':
			imagegif($image_p, $this->full_path());
			break;
			case 'jpg':
			imagejpeg($image_p, $this->full_path(), 100);
			break;
			case 'png':
			imagepng($image_p, $this->full_path(), 8, PNG_FILTER_NONE);
			break;
		}
	}

	public function display($size=null,$filetype=null) {
		if($size!==null && $size!=$this->size) {
			$img=new image($size.'/'.$this->filename.'.'.$this->output_type);
			$img->display(null,$filetype);
			return;
		}
		$ftype=$this->output_type;
		
		if($filetype && in_array($filetype,array_keys($this->types))) $ftype=$filetype;
		if(isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH']==md5($this->filename.$size)) {
			header("HTTP/1.1 304 Not Modified");
			exit;
		}
		header('Content-type: '.$this->types[$ftype]);
		if($ftype==$this->type) {
			header("Content-Length: " . filesize($this->full_path()));
			header('Cache-Control: public');
			header("Last-Modified: ".gmdate("D, d M Y H:i:s", filectime($this->full_path()))." GMT");
			header('Expires: '.gmdate('D, d M Y H:i:s',mktime(10,10,10,10,10,2020)).' GMT');
			header('Pragma: public');
			header('Etag: '.md5($this->filename.$size));
			readfile($this->full_path());
			exit;
		}
		switch($this->type) {
			case 'gif':
			$img=imagecreatefromgif($this->full_path());
			break;
			case 'png':
			$img=imagecreatefrompng($this->full_path());
			break;
			case 'jpg':
			$img=imagecreatefromjpeg($this->full_path());
			break;
			case 'bmp':
			$img=imagecreatefromwbmp($this->full_path());
			break;
		}

		switch($ftype) {
			case 'gif':
			imagegif($img);
			exit;
			case 'png':
			imagepng($img);
			exit;
			case 'jpg':
			imagejpeg($img);
			exit;
			case 'bmp':
			imagewbmp($img);
			exit;
		}
	}

	private function fullsize_path() {
		return $this->file_dir.$this->type_path.'full/'.$this->filename;
	}
	
	public function remove() {
		if(strlen($this->get_filename()) < 32) return;
		$p=$this->get_type_path();
		$d=dir($p);
		while (false !== ($entry = $d->read())) {
			if(substr($entry,0,1)=='.') continue;
			if(is_dir($p.$entry)) {
				$o=dir($p.$entry);
				while (false !== ($e = $o->read())) {
					if(substr($e,0,1)=='.') continue;
					if($e==$this->get_filename()) {
						//echo $p.$entry.'/'.$e."\n";
						unlink($p.$entry.'/'.$e);
					}
				}
				$o->close();
			}
		}
		$d->close();
	}
}
?>
