<?
/* CLASS
 * TinyMCE class to handle inserting the javascript editor box into the application.
 *
 */
 
class tinymce {

	private $options	=	NULL;//Holds an array of options set for the init() method in TinyMCE js file
	private $mode		=	'exact';//Use 'exact' as default mode for tinymce
	private $elems		=	NULL;//we can store an array of element ids in here
	
	public function __construct($width=640,$height=480,$elems=NULL){
		//default the editor to mode=exact and elements to what ever is in $elems
		//without any $elems, the mode will default to textareas (all textareas on the page will
		//use the editor)
		if(isset($elems)){
			$this->set_option('mode','exact','string');
			$this->set_option('elements',$elems,'string');
		}else{
			$this->set_option('mode','textareas','string');	
		}
		//set the default width and height...	
		$this->set_option('width',''.$width.'','string');
		$this->set_option('height',''.$height.'','string');
		
		//set some more default options from main config file..
		$cfg	=	config::get_class_config('tinymce_default_options');
		if(count($cfg)>0){
			foreach($cfg as $option_name=>$value){
				list($opt_val,$type)	=	explode("|",$value);
				$this->set_option($option_name,$opt_val,$type);
			}
		}		
	}
	
	private function filter_parameters($param){
		//remove any invalid characters from the parameter
		$param	=	str_replace('"','',$param);
		return $param;
	}
	
	public function set_option($option_name='',$option_parameter='',$option_var_type){
		
		
		switch($option_var_type){
			case 'boolean':
				if(is_bool($option_parameter)){
					$setting	=	$option_parameter;
				}else{
					$setting	=	false;//said it was a boolean that was passed, but wasn't
				}			
			break;
			
			case 'string':
				if(is_string($option_parameter)){
					$setting	=	'"'.$this->filter_parameters($option_parameter).'"';
				}else{
					$setting	=	false;//said it was a string that was passed, but wasn't'
				}
			break;
			
			default:
				$setting	=	false;//don't do anything if the option_var_type variable isn't set
		}
		if(!$setting){
			return false;//this option will not get set because it isn't formatted correctly
		}
		$this->options[$option_name]	=	$setting;
		return true;
	}

	public function init($display=false){
		$output		=	array();
		$output[]	=	'<script language="javascript" type="text/javascript">';
		$output[]	=	'tinyMCE.init({';
		
		foreach($this->options as $option=>$setting){
			$configs[]	=	"\t".$option.' : '.$setting;
		}
		$output[]	=	join(",\n",$configs);
		$output[]	=	'});';
		$output[]	=	'</script>';
		$final_output		=	join("\n",$output);
		if(!$display){
			return 	$final_output;
		}else{
			echo	$final_output;
		}		
	} 
}
?>