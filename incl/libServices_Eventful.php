<?PHP
// +-----------------------------------------------------------------------+
// | Copyright 2007 Eventful, Inc.                                             |
// | All rights reserved.                                                  |
// |                                                                       |
// | Redistribution and use in source and binary forms, with or without    |
// | modification, are permitted provided that the following conditions    |
// | are met:                                                              |
// |                                                                       |
// | o Redistributions of source code must retain the above copyright      |
// |   notice, this list of conditions and the following disclaimer.       |
// | o Redistributions in binary form must reproduce the above copyright   |
// |   notice, this list of conditions and the following disclaimer in the |
// |   documentation and/or other materials provided with the distribution.|
// | o The names of the authors may not be used to endorse or promote      |
// |   products derived from this software without specific prior written  |
// |   permission.                                                         |
// |                                                                       |
// | THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS   |
// | "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT     |
// | LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR |
// | A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT  |
// | OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, |
// | SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT      |
// | LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, |
// | DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY |
// | THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT   |
// | (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE |
// | OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.  |
// |                                                                       |
// +-----------------------------------------------------------------------+
// | Authors: Chris Radcliff <chris@eventful.com>                          |
// |          Chuck Norris   <chuck@eventful.com>                          |
// +-----------------------------------------------------------------------+
//

/**
 * uses PEAR error management
 */
//require_once 'PEAR.php'; // Done been un-PEARed by golly.

/**
 * uses HTTP to send the request
 */
//require_once 'HTTP/Request.php';

/**
 * Services_Eventful
 *
 * Client for the REST-based Web service at http://api.eventful.com
 *
 * Eventful is the world's largest collection of events, taking place in 
 * local markets throughout the world, from concerts and sports to singles
 * events and political rallies.
 * 
 * Eventful.com is built upon a unique, open platform that enables partners
 * and web applications to leverage Eventful's data, features and functionality
 * via the Eventful API or regular data feeds. 
 *
 * Services_Eventful allows you to
 * - search for Eventful items (events, venues, performers, demands, etc.)
 * - create, modify, or delete Eventful items
 * - get details for any Eventful item 
 * from PHP (5 or greater).
 * 
 * See http://api.eventful.com for a complete list of available methods.
 *
 * @author		Chris Radcliff <chris@eventful.com>
 * @package		Services_Eventful
 * @version		0.9.1
 */
class Services_Eventful
{
   /**
    * URI of the REST API
    *
    * @access  public
    * @var     string
    */
    public $api_root = 'http://api.eventful.com';
        
   /**
    * Application key (as provided by http://api.eventful.com)
    *
    * @access  public
    * @var     string
    */
    public $app_key   = null;

   /**
    * Username
    *
    * @access  private
    * @var     string
    */
    private $user   = null;

   /**
    * Password
    *
    * @access  private
    * @var     string
    */
    private $_password = null;
    
   /**
    * User authentication key
    *
    * @access  private
    * @var     string
    */
    private $user_key = null;
    
   /**
    * Latest request URI
    *
    * @access  private
    * @var     string
    */
    private $_request_uri = null;
        
   /**
    * Latest response as unserialized data
    *
    * @access  public
    * @var     string
    */
    public $_response_data = null;
    
   /**
    * Create a new client
    *
    * @access  public
    * @param   string      app_key
    */
    function __construct($app_key)
    {
        $this->app_key = $app_key;
    }
    
   /**
    * Log in and verify the user.
    *
    * @access  public
    * @param   string      user
    * @param   string      password
    */
    function login($user, $password)
    {
        $this->user     = $user;
        
        /* Call login to receive a nonce.
         * (The nonce is stored in an error structure.)
         */
        $this->call('users/login', array() );
        $data = $this->_response_data;
        $nonce = $data['nonce'];
        
        // Generate the digested password response.
        $response = md5( $nonce . ":" . md5($password) );
        
        // Send back the nonce and response.
        $args = array(
          'nonce'    => $nonce,
          'response' => $response,
        );
		try{
			$r = $this->call('users/login', $args);
		}catch(Exception $e) {
            $this->_password = $response . ":" . $nonce;
            throw new Exception("Login error");
        }
        
        // Store the provided user_key.
        $this->user_key = (string) $r->user_key;
        
        return 1;
    }
    
   /**
    * Call a method on the Eventful API.
    *
    * @access  public
    * @param   string      arguments
    */
    function call($method, $args=array()) 
    {
        /* Methods may or may not have a leading slash.
         */
        $method = trim($method,'/ ');

        /* Construct the URL that corresponds to the method.
         */
        $url = $this->api_root . '/rest/' . $method;
        $this->_request_uri = $url;
        $req = new http($url);
		$req->add_header('User-Agent','Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)');
        
        /* Add each argument to the POST body.
         */
        $req->add_get('app_key',  $this->app_key);
        $req->add_get('user',     $this->user);
        $req->add_get('user_key', $this->user_key);
		$req->use_cache();
        foreach ($args as $key => $value) 
        {
            if ( preg_match('/_file$/', $key) )
            {
                // Treat file parameters differently.
                
                //$req->addFile($key, $value); // Don't have this yet, don't know if we'll need it.
            }
            elseif ( is_array($value) ) 
            {
                foreach ($value as $instance) 
                {
                    $req->add_get($key, $instance);
                }
            } 
            else 
            {
                $req->add_get($key, $value);
            }
        }
            
        /* Send the request and handle basic HTTP errors.
         */
        $req->execute();
        if ($req->code != 200) 
        {
            throw new Exception('Invalid Response Code: ' . $req->code);
        }
        
        /* Process the response XML through SimpleXML
         */
        $response = $req->response;
        $this->_response_data = $response;
        $data = new SimpleXMLElement($response);
    
        /* Check for call-specific error messages
         */
        if ($data->getName() === 'error') 
        {
            $error = $data['string'] . ": " . $data->description;
            $code = $data['string'];
            throw new Exception($error);
        }
    
        return($data);
    }
}
?>
